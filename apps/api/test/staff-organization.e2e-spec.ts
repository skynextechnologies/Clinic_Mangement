import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator.js';
import { PERMISSIONS_KEY } from '../src/common/decorators/require-permissions.decorator.js';

describe('Staff & Organization Management (E2E)', () => {
  let app: INestApplication;
  let reflector: Reflector;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    await app.init();

    reflector = app.get(Reflector);

    // Login as OWNER (seeded user)
    const ownerLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@clinicos.local',
        password: 'OwnerPass1234!',
      })
      .expect(200);

    ownerToken = ownerLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Deny-by-Default Route Scanner', () => {
    it('should verify that all new controllers have explicit @Public() or @RequirePermissions() decorators', () => {
      const container = (
        app as unknown as {
          container: {
            getModules: () => Map<
              string,
              {
                controllers: Map<
                  string,
                  { metatype: new (...args: unknown[]) => Record<string, unknown> }
                >;
              }
            >;
          };
        }
      ).container;
      const modules = container.getModules();

      const unguardedRoutes: string[] = [];

      modules.forEach((moduleRef) => {
        const controllers = moduleRef.controllers;
        controllers.forEach((wrapper) => {
          const controllerClass = wrapper.metatype;
          if (!controllerClass) return;

          const classPublic = reflector.get<boolean>(IS_PUBLIC_KEY, controllerClass);
          const classPermissions = reflector.get<string[]>(PERMISSIONS_KEY, controllerClass);

          const prototype = controllerClass.prototype;
          const propertyNames = Object.getOwnPropertyNames(prototype).filter(
            (item) => item !== 'constructor' && typeof prototype[item] === 'function',
          );

          propertyNames.forEach((methodName) => {
            const handler = prototype[methodName];
            const isRouteHandler = Reflect.hasMetadata('path', handler);
            if (!isRouteHandler) return;

            const methodPublic = reflector.get<boolean>(IS_PUBLIC_KEY, handler);
            const methodPermissions = reflector.get<string[]>(PERMISSIONS_KEY, handler);

            const isPublic = methodPublic ?? classPublic ?? false;
            const hasPermissions =
              (methodPermissions && methodPermissions.length > 0) ||
              (classPermissions && classPermissions.length > 0);

            if (!isPublic && !hasPermissions) {
              unguardedRoutes.push(`${controllerClass.name}.${methodName}`);
            }
          });
        });
      });

      expect(unguardedRoutes).toEqual([]);
    });
  });

  describe('Branches API', () => {
    let createdBranchId: string;

    it('should create a new branch', async () => {
      const code = `TEST_BR_${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          code,
          name: 'North Wing Clinic',
          address: '123 Medical Way',
          phone: '+15550199',
          timezone: 'America/New_York',
        });

      if (res.status !== 201) {
        console.error('CREATE BRANCH ERROR DETAIL:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toBe(code);
      createdBranchId = res.body.data.id;
    });

    it('should list branches with pagination and search', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/branches?search=North')
        .set('Authorization', `Bearer ${ownerToken}`);

      if (res.status !== 200) {
        console.log('LIST BRANCHES FAIL:', res.status, res.body);
      }
      expect(res.status).toBe(200);

      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('should update branch details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/branches/${createdBranchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'North Wing Specialty Clinic',
        })
        .expect(200);

      expect(res.body.data.name).toBe('North Wing Specialty Clinic');
    });
  });

  describe('Departments API', () => {
    let _createdDeptId: string;

    it('should create a department', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Cardiology',
          description: 'Heart and cardiovascular care',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Cardiology');
      _createdDeptId = res.body.data.id;
    });

    it('should list departments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Rooms API', () => {
    let branchId: string;
    let deptId: string;

    beforeAll(async () => {
      const bRes = await request(app.getHttpServer())
        .get('/api/v1/branches')
        .set('Authorization', `Bearer ${ownerToken}`);
      branchId = bRes.body.data.items[0].id;

      const dRes = await request(app.getHttpServer())
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${ownerToken}`);
      deptId = dRes.body.data.items[0].id;
    });

    it('should create a room associated with a branch and department', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          branchId,
          departmentId: deptId,
          name: 'Consultation Room 101',
          code: 'RM-101',
          type: 'CONSULTATION',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.branchId).toBe(branchId);
      expect(res.body.data.departmentId).toBe(deptId);
    });

    it('should list rooms filtered by branchId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/rooms?branchId=${branchId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Staff Invitations, Acceptance & Deactivation Flow', () => {
    it('should complete the full staff lifecycle (invite > accept > login > edit profile > deactivate > reactivate)', async () => {
      // 1. Get primary branch
      const bRes = await request(app.getHttpServer())
        .get('/api/v1/branches')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const branchId = bRes.body.data.items[0].id;

      // 2. Invite doctor
      const email = `doctor-${Date.now()}@clinicos.local`;
      const inviteRes = await request(app.getHttpServer())
        .post('/api/v1/staff/invite')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email,
          roles: ['DOCTOR'],
          branchIds: [branchId],
        })
        .expect(201);

      const token = inviteRes.body.data.token;
      expect(token).toBeDefined();

      // 3. Test invalid token rejection
      await request(app.getHttpServer())
        .post('/api/v1/staff/invitations/accept')
        .send({
          token: 'invalid-token-1234567890',
          firstName: 'Jane',
          lastName: 'Doc',
          password: 'DocPass1234!',
        })
        .expect(400);

      // 4. Accept invitation
      const acceptRes = await request(app.getHttpServer())
        .post('/api/v1/staff/invitations/accept')
        .send({
          token,
          firstName: 'Jane',
          lastName: 'Doc',
          password: 'DocPass1234!',
          phone: '+15550188',
        })
        .expect(201);

      const doctorId = acceptRes.body.data.userId;
      expect(doctorId).toBeDefined();

      // 5. Login with newly created doctor
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'DocPass1234!',
        })
        .expect(200);

      const doctorToken = loginRes.body.data.accessToken;
      expect(doctorToken).toBeDefined();

      // 6. Update profile
      const profileRes = await request(app.getHttpServer())
        .patch(`/api/v1/staff/${doctorId}/profile`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          specialty: 'General Practice',
          licenseNo: 'MED-998877',
          consultationFeeMinor: 5000,
          slotMinutes: 20,
        })
        .expect(200);

      expect(profileRes.body.data.specialty).toBe('General Practice');

      // 7. Deactivate doctor (revokes session)
      const deactRes = await request(app.getHttpServer())
        .post(`/api/v1/staff/${doctorId}/deactivate`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(201);

      expect(deactRes.body.data.revokedSessionsCount).toBeGreaterThanOrEqual(1);

      // 8. Revoked token request fails with 401
      await request(app.getHttpServer())
        .get('/api/v1/staff')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(401);

      // 9. Reactivate doctor
      await request(app.getHttpServer())
        .post(`/api/v1/staff/${doctorId}/reactivate`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(201);

      // 10. Login works again after reactivation
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'DocPass1234!',
        })
        .expect(200);
    });
  });
});
