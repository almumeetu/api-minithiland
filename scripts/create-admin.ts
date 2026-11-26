import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';
import { seedAuth } from '../prisma/seed-auth';

async function main() {
  const email = process.argv[2] || 'superadmin@ecom.com';
  const rawPassword = process.argv[3] || 'password';

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log(`\n👑 Admin Setup Script — Mini Thailand`);
    console.log(`----------------------------------------`);

    // Ensure all roles and base permissions exist
    await seedAuth(prisma);

    const superadminRole = await prisma.role.findFirst({
      where: { name: 'superadmin' },
    });

    if (!superadminRole) {
      throw new Error('Could not find or create superadmin role.');
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const targetEmail = email.trim().toLowerCase();

    const user = await prisma.user.upsert({
      where: { email: targetEmail },
      update: {
        roleId: superadminRole.id,
        password: hashedPassword,
        emailVerifiedAt: new Date(),
      },
      create: {
        name: targetEmail.split('@')[0],
        email: targetEmail,
        password: hashedPassword,
        roleId: superadminRole.id,
        emailVerifiedAt: new Date(),
      },
      include: {
        role: true,
      },
    });

    console.log(`\n✅ SUCCESS! Super Admin Ready:`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${rawPassword}`);
    console.log(`   Role:     ${user.role?.name}`);
    console.log(`   Login at: /admin/login\n`);

    // List all admins
    const allAdmins = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ['superadmin', 'admin', 'manager', 'staff'] },
        },
      },
      select: {
        email: true,
        role: { select: { name: true } },
      },
    });

    console.log(`📋 All Administrative Accounts in Database:`);
    allAdmins.forEach((a) => {
      console.log(`   - ${a.email} [Role: ${a.role?.name}]`);
    });
    console.log(`----------------------------------------\n`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Error creating/updating admin:', err);
  process.exit(1);
});
