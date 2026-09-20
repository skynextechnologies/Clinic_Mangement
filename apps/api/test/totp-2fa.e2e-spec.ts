import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import { generateSync } from 'otplib';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '@clinicos/shared';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infra/prisma/prisma.service.js';

describe('TOTP Two-Factor Authentication System (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testUserToken: string;
  let testUserId: string;
  let tempSecret: string;
  let rawBackupCodes: string[];
  let loginTempToken: string;

  const TEST_EMAIL = 'totp-test-user@clinicos.local';
  const TEST_PASS = 'TestUserPass1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // Create isolated user for 2FA tests
    const passwordHash = await argon2.hash(TEST_PASS, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: {
        passwordHash,
        twoFactorEnabled: false,
        twoFactorSecretEnc: null,
      },
      create: {
        email: TEST_EMAIL,
        passwordHash,
        firstName: 'TOTP',
        lastName: 'Tester',
        roles: {
          create: { role: Role.ADMIN },
        },
      },
    });

    testUserId = user.id;

    // Login as test user
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASS,
      })
      .expect(200);

    testUserToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (prisma && testUserId) {
      await prisma.backupCode.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  describe('2FA Setup & Enrollment Flow', () => {
    it('should generate a TOTP secret and QR code URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/setup')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(res.body.data.secret).toBeDefined();
      expect(res.body.data.otpauthUrl).toContain('otpauth://totp/');
      expect(res.body.data.qrCodeUrl).toContain('data:image/png;base64,');

      tempSecret = res.body.data.secret;
    });

    it('should fail to enable 2FA with an invalid 6-digit TOTP token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/enable')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          secret: tempSecret,
          token: '000000',
        })
        .expect(400);
    });

    it('should successfully enable 2FA with a valid TOTP token and return 10 backup codes', async () => {
      const validToken = generateSync({ secret: tempSecret });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/enable')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          secret: tempSecret,
          token: validToken,
        })
        .expect(200);

      expect(res.body.data.message).toBe('2FA enabled successfully');
      expect(res.body.data.backupCodes).toHaveLength(10);
      rawBackupCodes = res.body.data.backupCodes;
    });

    it('should encrypt secret at rest in PostgreSQL DB', async () => {
      const rawUserRow = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          twoFactorEnabled: true,
          twoFactorSecretEnc: true,
        },
      });

      expect(rawUserRow?.twoFactorEnabled).toBe(true);
      expect(rawUserRow?.twoFactorSecretEnc).toBeDefined();
      expect(rawUserRow?.twoFactorSecretEnc?.split(':')).toHaveLength(3);
      // Secret must not be in plaintext
      expect(rawUserRow?.twoFactorSecretEnc).not.toContain(tempSecret);
    });
  });

  describe('2FA Step-Up Login Challenge & Verification', () => {
    it('should trigger 2FA step-up challenge upon valid password login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASS,
        })
        .expect(200);

      expect(res.body.data.requires2Factor).toBe(true);
      expect(res.body.data.tempToken).toBeDefined();
      expect(res.body.data.accessToken).toBeUndefined();

      loginTempToken = res.body.data.tempToken;
    });

    it('should fail 2FA verification with wrong TOTP code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({
          tempToken: loginTempToken,
          code: '999999',
        })
        .expect(401);
    });

    it('should complete login when providing valid TOTP code', async () => {
      const validToken = generateSync({ secret: tempSecret });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({
          tempToken: loginTempToken,
          code: validToken,
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should complete login using a single-use backup code', async () => {
      // 1. Get new temp token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASS,
        })
        .expect(200);

      const tempToken = loginRes.body.data.tempToken;
      const backupCodeToUse = rawBackupCodes[0]!;

      // 2. Verify using backup code
      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({
          tempToken,
          code: backupCodeToUse,
        })
        .expect(200);

      expect(verifyRes.body.data.accessToken).toBeDefined();
    });

    it('should invalidate backup code after single use', async () => {
      // 1. Get new temp token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASS,
        })
        .expect(200);

      const tempToken = loginRes.body.data.tempToken;
      const alreadyUsedBackupCode = rawBackupCodes[0]!;

      // 2. Attempt to reuse same backup code -> 401
      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({
          tempToken,
          code: alreadyUsedBackupCode,
        })
        .expect(401);
    });
  });

  describe('Backup Code Management & 2FA Disable', () => {
    it('should fail to regenerate backup codes with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/backup-codes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ password: 'WrongPassword123!' })
        .expect(401);
    });

    it('should regenerate 10 new backup codes with valid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/backup-codes')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ password: TEST_PASS })
        .expect(200);

      expect(res.body.data.backupCodes).toHaveLength(10);
      expect(res.body.data.backupCodes).not.toEqual(rawBackupCodes);
    });

    it('should disable 2FA with password confirmation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/disable')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ password: TEST_PASS })
        .expect(200);

      expect(res.body.data.message).toBe('2FA disabled successfully');

      // Verify DB state
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { twoFactorEnabled: true, twoFactorSecretEnc: true },
      });

      expect(dbUser?.twoFactorEnabled).toBe(false);
      expect(dbUser?.twoFactorSecretEnc).toBeNull();
    });

    it('should log in without 2FA prompt after 2FA is disabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASS,
        })
        .expect(200);

      expect(res.body.data.requires2Factor).toBe(false);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});
