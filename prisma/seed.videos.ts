import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedVideos(prisma: PrismaClient) {
  console.log('Seeding 6 real Facebook Reels...');

  // Find products to link
  const products = await prisma.product.findMany({
    take: 8,
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${products.length} products to link.`);

  // Check if videos already exist
  const existingCount = await prisma.video.count();
  if (existingCount > 0) {
    console.log(`Already have ${existingCount} videos, updating URLs...`);
    // Ensure thumbnails have proper paths
    await prisma.video.deleteMany({});
  }

  const sampleVideos = [
    {
      title: 'Thai Cord Set — Rose Pink Special',
      caption: 'থাই কর্ড সেট — লাইভ স্পেশাল কালেকশন। পিওর সফট সিল্কি ফিনিশ ও স্টাইলিশ ফিটিং। সরাসরি ফেসবুক লাইভে দেখানো জনপ্রিয় ডিজাইন!',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/minithailand2022/',
      videoUrl: '/videos/reels-1.mp4',
      thumbnailUrl: '/videos/reels-1-thumb.png',
      durationSec: 30,
      views: '24.8K',
      likes: '1.8K',
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
      productId: products[0]?.id || null,
    },
    {
      title: 'Wine Red Tiered Velvet Party Gown',
      caption: 'ওয়াইন রেড ভেলভেট গর্জিয়াস পার্টি গাউন। রাজকীয় আভিজাত্য ও আধুনিক প্যাটার্ন। যেকোনো ওয়েডিং বা ইভেন্টে মধ্যমণি হন।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/minithailand2022/',
      videoUrl: '/videos/reels-2.mp4',
      thumbnailUrl: '/videos/reels-2-thumb.png',
      durationSec: 15,
      views: '32.1K',
      likes: '3.2K',
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
      productId: products[1]?.id || null,
    },
    {
      title: 'Imported Bangkok 2-Piece Cord Set',
      caption: 'ব্যাংকক ইমপোর্টেড এক্সক্লুসিভ ২-পিস কর্ড সেট। গর্জিয়াস কাট, ট্রেন্ডি কালার প্যালেট ও প্রিমিয়াম ম্যাটেরিয়াল।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/minithailand2022/',
      videoUrl: '/videos/reels-3.mp4',
      thumbnailUrl: '/videos/reels-3-thumb.png',
      durationSec: 35,
      views: '19.4K',
      likes: '1.5K',
      isFeatured: true,
      isActive: true,
      sortOrder: 3,
      productId: products[2]?.id || null,
    },
    {
      title: 'Dubai Style Beige Shrug & Luxury Abaya',
      caption: 'দুবাই স্টাইল বেইজ আবায়া ও শ্রাগ সেট। সাথে থাকছে ম্যাচিং প্রিমিয়াম শিফন হিজাব। ফ্যাশনেবল ও মার্জিত আউটফিট।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/minithailand2022/',
      videoUrl: '/videos/reels-4.mp4',
      thumbnailUrl: '/videos/reels-4-thumb.png',
      durationSec: 29,
      views: '27.9K',
      likes: '2.6K',
      isFeatured: true,
      isActive: true,
      sortOrder: 4,
      productId: products[3]?.id || null,
    },
    {
      title: 'Textured Animal Print Long Overcoat & Winter Edit',
      caption: 'চিটা প্রিন্ট লাক্সারি লং ওভারকোট ও উইন্টার কালেকশন। শীতের ফ্যাশনে ট্রেন্ডি লুক ও সর্বোচ্চ স্বাচ্ছন্দ্য।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/minithailand2022/',
      videoUrl: '/videos/reels-5.mp4',
      thumbnailUrl: '/videos/reels-5-thumb.png',
      durationSec: 8,
      views: '15.6K',
      likes: '1.1K',
      isFeatured: true,
      isActive: true,
      sortOrder: 5,
      productId: products[4]?.id || null,
    },
    {
      title: 'Emerald Green Royal Velvet Kaftan & Party Wear',
      caption: 'পান্না সবুজ রাজকীয় ভেলভেট কাফতান। গোল্ডেন এমব্রয়ডারি ওয়ার্ক ও ফ্লোয়ি কাট। উৎসবের সাজে সেরা নির্বাচন।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/minithailand2022/',
      videoUrl: '/videos/reels-6.mp4',
      thumbnailUrl: '/videos/reels-6-thumb.png',
      durationSec: 18,
      views: '21.3K',
      likes: '1.9K',
      isFeatured: true,
      isActive: true,
      sortOrder: 6,
      productId: products[5]?.id || null,
    },
  ];

  for (const item of sampleVideos) {
    const created = await prisma.video.create({
      data: item,
    });
    console.log(`Created video: ${created.title} (${created.id})`);
  }

  console.log('Video seeding completed successfully!');
}

async function main() {
  await seedVideos(prisma);
}

if (process.argv[1] && process.argv[1].includes('seed.videos')) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
