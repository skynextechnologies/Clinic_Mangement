import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /auth/login with valid owner credentials returns access token and refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: 'OwnerPass1234!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe('owner@clinicos.local');
    expect(res.body.data.user.roles).toContain('OWNER');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refreshToken=');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('POST /auth/login with wrong password returns generic 401 error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(res.body.detail).toBe('Invalid email or password');
  });

  it('POST /auth/refresh rotates refresh token and issues new access token', async () => {
    // 1. Login to get initial cookies
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: 'OwnerPass1234!',
      })
      .expect(200);

    const refreshCookie = loginRes.headers['set-cookie'][0];

    // 2. Perform refresh
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [refreshCookie])
      .expect(200);

    expect(refreshRes.body.data).toHaveProperty('accessToken');
    expect(refreshRes.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/refresh with reused rotated token revokes entire session family', async () => {
    // 1. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: 'OwnerPass1234!',
      })
      .expect(200);

    const initialCookie = loginRes.headers['set-cookie'][0];

    // 2. Perform legitimate refresh (rotates token)
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [initialCookie])
      .expect(200);

    // 3. Attempt REUSE of old initialCookie (should trigger reuse detection & revoke family)
    const reuseRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [initialCookie])
      .expect(401);

    expect(reuseRes.body.detail).toContain('Refresh token reuse detected');
  });

  it('GET /auth/me returns profile for authenticated Bearer token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: 'OwnerPass1234!',
      })
      .expect(200);

    const accessToken = loginRes.body.data.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.data.email).toBe('owner@clinicos.local');
    expect(meRes.body.data.roles).toContain('OWNER');
  });

  it('POST /auth/forgot-password and POST /auth/reset-password flow', async () => {
    // 1. Forgot password
    const forgotRes = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'owner@clinicos.local' })
      .expect(200);

    const devToken = forgotRes.body.data.devToken;
    expect(devToken).toBeDefined();

    // 2. Reset password
    const newPassword = 'NewSecretOwnerPass1234!';
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: devToken,
        newPassword,
      })
      .expect(200);

    // 3. Login with new password
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: newPassword,
      })
      .expect(200);

    // 4. Restore original password for downstream tests
    const resetRes2 = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'owner@clinicos.local' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: resetRes2.body.data.devToken,
        newPassword: 'OwnerPass1234!',
      })
      .expect(200);
  });
});
