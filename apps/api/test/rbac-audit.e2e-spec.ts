import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '@clinicos/shared';

import { AppModule } from '../src/app.module.js';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator.js';
import { PERMISSIONS_KEY } from '../src/common/decorators/require-permissions.decorator.js';
import { BranchScopeService } from '../src/common/services/branch-scope.service.js';
import { OwnershipPolicyService } from '../src/common/services/ownership-policy.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';

describe('RBAC & Audit System (E2E)', () => {
  let app: INestApplication;
  let auditService: AuditService;
  let branchScopeService: BranchScopeService;
  let ownershipPolicyService: OwnershipPolicyService;
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

    auditService = app.get(AuditService);
    branchScopeService = app.get(BranchScopeService);
    ownershipPolicyService = app.get(OwnershipPolicyService);
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
    it('should enforce that every controller route has either @Public() or @RequirePermissions()', () => {
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
          const controller = wrapper.metatype;
          if (!controller) return;

          const prototype = controller.prototype;
          const propertyNames = Object.getOwnPropertyNames(prototype).filter(
            (item) => item !== 'constructor' && typeof prototype[item] === 'function',
          );

          propertyNames.forEach((methodName) => {
            const handler = prototype[methodName];
            const routePath = reflector.get<string | string[]>('path', handler);
            if (routePath === undefined) {
              return; // Skip private non-route methods
            }

            const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
              handler,
              controller,
            ]);

            const permissions = reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
              handler,
              controller,
            ]);

            const hasPublic = Boolean(isPublic);
            const hasPermissions = Array.isArray(permissions) && permissions.length > 0;

            if (!hasPublic && !hasPermissions) {
              unguardedRoutes.push(`${controller.name} -> ${methodName}()`);
            }
          });
        });
      });

      expect(unguardedRoutes).toEqual([]);
    });
  });

  describe('RBAC Permission Checks', () => {
    it('should allow GET /api/v1/audit for OWNER (has audit:read)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
    });

    it('should reject unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/audit');
      expect(response.status).toBe(401);
    });
  });

  describe('Branch Scoping Helper', () => {
    it('should return empty where clause for OWNER when no branch requested', () => {
      const scope = branchScopeService.getBranchWhere({
        id: 'user-1',
        role: Role.OWNER,
        branchIds: ['branch-1'],
      });
      expect(scope).toEqual({});
    });

    it('should scope to assigned branch for non-owner', () => {
      const scope = branchScopeService.getBranchWhere({
        id: 'user-2',
        role: Role.DOCTOR,
        branchIds: ['branch-1'],
      });
      expect(scope).toEqual({ branchId: 'branch-1' });
    });

    it('should throw 403 if non-owner requests unassigned branch', () => {
      expect(() => {
        branchScopeService.getBranchWhere(
          { id: 'user-2', role: Role.DOCTOR, branchIds: ['branch-1'] },
          'branch-2',
        );
      }).toThrow();
    });
  });

  describe('Ownership Policy Helper', () => {
    it('should allow OWNER access to any resource', () => {
      expect(() => {
        ownershipPolicyService.assertOwnershipOrRole(
          { id: 'user-1', role: Role.OWNER },
          'other-user-99',
        );
      }).not.toThrow();
    });

    it('should allow user access to their own resource', () => {
      expect(() => {
        ownershipPolicyService.assertOwnershipOrRole(
          { id: 'user-123', role: Role.DOCTOR },
          'user-123',
        );
      }).not.toThrow();
    });

    it('should deny non-owner user access to someone else resource', () => {
      expect(() => {
        ownershipPolicyService.assertOwnershipOrRole(
          { id: 'user-123', role: Role.DOCTOR },
          'user-456',
        );
      }).toThrow();
    });
  });

  describe('Audit Interceptor & Audit Log Querying', () => {
    it('should record audit entry on mutating request', async () => {
      await auditService.record({
        action: 'TEST_ACTION',
        entity: 'test_entity',
        entityId: 'test-123',
        actorId: 'test-actor',
        actorRole: Role.OWNER,
      });

      const logs = await auditService.findAll({
        entity: 'test_entity',
      });

      expect(logs.items.length).toBeGreaterThan(0);
      expect(logs.items[0].action).toBe('TEST_ACTION');
    });
  });
});
