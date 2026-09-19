import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('AuditLog Append-Only Trigger (DB Level)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('allows INSERTing an audit_log record', async () => {
    const entry = await prisma.auditLog.create({
      data: {
        action: 'TEST_CREATE',
        entity: 'TestEntity',
        entityId: 'test-123',
        actorId: 'system',
        reason: 'Automated trigger verification',
      },
    });

    expect(entry).toHaveProperty('id');
    expect(entry.action).toBe('TEST_CREATE');
  });

  it('blocks UPDATING an audit_log record at the database level', async () => {
    const entry = await prisma.auditLog.create({
      data: {
        action: 'TEST_UPDATE_BLOCK',
        entity: 'TestEntity',
        entityId: 'test-456',
      },
    });

    await expect(
      prisma.auditLog.update({
        where: { id: entry.id },
        data: { action: 'MODIFIED' },
      }),
    ).rejects.toThrow(/audit_log table is append-only/);
  });

  it('blocks DELETING an audit_log record at the database level', async () => {
    const entry = await prisma.auditLog.create({
      data: {
        action: 'TEST_DELETE_BLOCK',
        entity: 'TestEntity',
        entityId: 'test-789',
      },
    });

    await expect(
      prisma.auditLog.delete({
        where: { id: entry.id },
      }),
    ).rejects.toThrow(/audit_log table is append-only/);
  });
});
