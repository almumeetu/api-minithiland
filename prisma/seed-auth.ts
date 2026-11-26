import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import type { PrismaClient } from '../src/generated/prisma/client';
import { PrismaClient as GeneratedPrismaClient } from '../src/generated/prisma/client';

dotenv.config();

/**
 * Top-level admin-panel sections that a role can be granted access to.
 * Each becomes a Permission row (Permission.name === section key) and the
 * frontend maps these keys to sidebar sections in lib/admin-sections.ts.
 * Keep this list in sync with the frontend constant.
 */
export const ADMIN_SECTION_KEYS = [
  'dashboard',
  'products',
  'stock',
  'sales',
  'orders',
  'reports',
  'reviews',
  'settings',
] as const;

export const SUPERADMIN_EMAIL = 'superadmin@ecom.com';
export const ADMIN_EMAIL = 'admin@ecom.com';
export const CUSTOMER_EMAIL = 'customer@ecom.com';
const DEFAULT_PASSWORD = 'password';

/** Find-or-create a role by name (Role.name is not unique in the schema). */
async function ensureRole(prisma: PrismaClient, name: string) {
  const existing = await prisma.role.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.role.create({ data: { name } });
}

/** Find-or-create a permission by name (Permission.name is not unique). */
async function ensurePermission(prisma: PrismaClient, name: string) {
  const existing = await prisma.permission.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.permission.create({ data: { name } });
}

/**
 * Seeds the section permissions, the protected `superadmin` and `admin` roles,
 * and the two staff accounts. Idempotent — safe to run on an existing database
 * and in production. The superadmin can manage everything; the admin role is
 * granted all sections by default and can be narrowed from the admin panel.
 */
export async function seedAuth(prisma: PrismaClient) {
  console.log('🔐 Seeding roles, permissions & staff accounts...');

  // 1. Section permissions
  const permissions = await Promise.all(
    ADMIN_SECTION_KEYS.map((key) => ensurePermission(prisma, key)),
  );
  const allPermissionIds = permissions.map((p) => ({ id: p.id }));

  // 2. Roles
  const superadminRole = await ensureRole(prisma, 'superadmin');
  const adminRole = await ensureRole(prisma, 'admin');
  const userRole = await ensureRole(prisma, 'user');

  // Superadmin bypasses permission checks, but we attach all sections for clarity.
  // The admin role gets every section by default; narrow it from the admin panel.
  await prisma.role.update({
    where: { id: superadminRole.id },
    data: { permissions: { set: allPermissionIds } },
  });
  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: { set: allPermissionIds } },
  });

  // 3. Staff accounts
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const superadmin = await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: { roleId: superadminRole.id, phone: '01706126663' },
    create: {
      name: 'Super Admin',
      email: SUPERADMIN_EMAIL,
      phone: '01706126663',
      password: hashed,
      emailVerifiedAt: new Date(),
      role: { connect: { id: superadminRole.id } },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { roleId: adminRole.id, phone: '01706126663' },
    create: {
      name: 'Admin',
      email: ADMIN_EMAIL,
      phone: '01706126663',
      password: hashed,
      emailVerifiedAt: new Date(),
      role: { connect: { id: adminRole.id } },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: { roleId: userRole.id, phone: '01700000000' },
    create: {
      name: 'Demo Customer',
      email: CUSTOMER_EMAIL,
      phone: '01700000000',
      password: hashed,
      emailVerifiedAt: new Date(),
      role: { connect: { id: userRole.id } },
    },
  });

  return { superadminRole, adminRole, userRole, superadmin, admin, customer };
}

if (process.argv[1] && process.argv[1].includes('seed-auth')) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new GeneratedPrismaClient({ adapter: new PrismaPg(pool) });
  seedAuth(prisma)
    .then(() => {
      console.log('✅ Auth seeding complete!');
      console.log('   Super Admin: superadmin@ecom.com (password: password)');
      console.log('   Admin:       admin@ecom.com (password: password)');
      console.log('   Customer:    customer@ecom.com (password: password)');
    })
    .catch((err) => {
      console.error('❌ Auth seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
