import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { seedAuth } from './seed-auth';
import { seedProducts } from './seed-products';
import { seedVideos } from './seed.videos';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await seedAuth(prisma);
    await seedProducts(prisma);
    await seedVideos(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
});
