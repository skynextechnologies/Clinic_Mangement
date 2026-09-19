import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

export async function seed() {
  console.log('🌱 Seeding ClinicOS database...');

  // 1. Default Branch
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {
      name: 'Main Branch',
    },
    create: {
      code: 'MAIN',
      name: 'Main Branch',
      timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
      isActive: true,
    },
  });
  console.log(`✅ Main Branch: ${mainBranch.name} (${mainBranch.id})`);

  // 2. Default Owner User
  const ownerEmail = process.env.INITIAL_OWNER_EMAIL || 'owner@clinicos.local';
  const ownerPassword = process.env.INITIAL_OWNER_PASSWORD || 'OwnerPass1234!';
  const passwordHash = await argon2.hash(ownerPassword);

  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      firstName: 'System',
      lastName: 'Owner',
    },
    create: {
      email: ownerEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Owner',
      isActive: true,
      mustChangePassword: true,
    },
  });

  // Assign OWNER role
  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId: ownerUser.id,
        role: Role.OWNER,
      },
    },
    update: {},
    create: {
      userId: ownerUser.id,
      role: Role.OWNER,
    },
  });

  // Link Owner to Main Branch
  await prisma.userBranch.upsert({
    where: {
      userId_branchId: {
        userId: ownerUser.id,
        branchId: mainBranch.id,
      },
    },
    update: { isPrimary: true },
    create: {
      userId: ownerUser.id,
      branchId: mainBranch.id,
      isPrimary: true,
    },
  });
  console.log(`✅ Owner User: ${ownerUser.email} (${ownerUser.id})`);

  // 3. Default Settings
  const defaultSettings = [
    { key: 'timezone', value: JSON.stringify(process.env.DEFAULT_TIMEZONE || 'UTC') },
    { key: 'currency', value: JSON.stringify(process.env.DEFAULT_CURRENCY || 'USD') },
    { key: 'clinic_name', value: JSON.stringify('ClinicOS Health Center') },
  ];

  for (const s of defaultSettings) {
    const existing = await prisma.setting.findFirst({
      where: { key: s.key, branchId: null },
    });
    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value: s.value },
      });
    } else {
      await prisma.setting.create({
        data: {
          key: s.key,
          value: s.value,
          branchId: null,
        },
      });
    }
  }
  console.log('✅ Default Settings seeded.');

  // 4. Default Sequences
  const defaultSequences = [
    { key: 'MRN', period: 'GLOBAL', next: 1 },
    { key: 'INV', period: '2026', next: 1 },
    { key: 'PO', period: '2026', next: 1 },
    { key: 'GRN', period: '2026', next: 1 },
  ];

  for (const seq of defaultSequences) {
    const existing = await prisma.sequence.findFirst({
      where: { key: seq.key, branchId: null, period: seq.period },
    });
    if (!existing) {
      await prisma.sequence.create({
        data: {
          key: seq.key,
          branchId: null,
          period: seq.period,
          next: seq.next,
        },
      });
    }
  }
  console.log('✅ Default Sequences seeded.');

  console.log('✨ Seed completed successfully.');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
