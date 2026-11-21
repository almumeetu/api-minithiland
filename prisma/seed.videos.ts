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

async function main() {
  console.log('Seeding 8 sample videos...');

  // Find products to link
  const products = await prisma.product.findMany({
    take: 8,
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${products.length} products to link.`);

  // Clear existing videos if any
  await prisma.video.deleteMany({});

  const sampleVideos = [
    {
      title: 'Thai Cord Set — Rose Pink Special',
      caption: 'থাই কর্ড সেট — লাইভ স্পেশাল কালেকশন। পিওর সফট সিল্কি ফিনিশ ও স্টাইলিশ ফিটিং। সরাসরি ফেসবুক লাইভে দেখানো জনপ্রিয় ডিজাইন!',
      type: 'reel' as const,
      source: 'facebook' as const,
      facebookUrl: 'https://www.facebook.com/reel/1399503357700927',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: '/products/cords set/905937710_1118136247512437_2099551318531647321_n.jpg',
      durationSec: 42,
      views: '18.4K',
      likes: '1.2K',
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
      facebookUrl: 'https://www.facebook.com/reel/1399503357700927',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: '/products/cords set/907179635_1119377164055012_4690738175147170981_n.jpg',
      durationSec: 58,
      views: '24.1K',
      likes: '2.5K',
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
      productId: products[1]?.id || null,
    },
    {
      title: 'Dubai Style Beige Shrug & Abaya Set',
      caption: 'দুবাই স্টাইল বেইজ আবায়া ও শ্রাগ সেট। সাথে থাকছে ম্যাচিং প্রিমিয়াম শিফন হিজাব। ফ্যাশনেবল ও মার্জিত আউটফিট।',
      type: 'reel' as const,
      source: 'facebook' as const,
      facebookUrl: 'https://www.facebook.com/reel/1399503357700927',
      videoUrl: null,
      thumbnailUrl: '/products/cords set/910465086_1119291994063529_6730173952863950097_n.jpg',
      durationSec: 35,
      views: '15.9K',
      likes: '980',
      isFeatured: true,
      isActive: true,
      sortOrder: 3,
      productId: products[2]?.id || null,
    },
    {
      title: 'Textured Animal Print Long Overcoat',
      caption: 'চিটা প্রিন্ট লাক্সারি লং ওভারকোট। শীতের ফ্যাশনে ট্রেন্ডি লুক দিন। প্রিমিয়াম ফ্যাব্রিক ও নিখুঁত ফিনিশিং।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/reel/1399503357700927',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: '/products/cords set/916496639_2050418568951611_3231227725146044425_n.jpeg',
      durationSec: 49,
      views: '31.2K',
      likes: '3.1K',
      isFeatured: true,
      isActive: true,
      sortOrder: 4,
      productId: products[3]?.id || null,
    },
    {
      title: 'Emerald Green Royal Velvet Kaftan',
      caption: 'পান্না সবুজ রাজকীয় ভেলভেট কাফতান। গোল্ডেন এমব্রয়ডারি ওয়ার্ক ও ফ্লোয়ি কাট। উৎসবের সাজে সেরা নির্বাচন।',
      type: 'video' as const,
      source: 'facebook' as const,
      facebookUrl: 'https://www.facebook.com/watch/?v=1399503357700927',
      videoUrl: null,
      thumbnailUrl: '/products/cords set/913180013_1120115427314519_7306115019982798276_n.jpg',
      durationSec: 72,
      views: '12.8K',
      likes: '1.1K',
      isFeatured: false,
      isActive: true,
      sortOrder: 5,
      productId: products[4]?.id || null,
    },
    {
      title: 'Pastel Lilac Korean Style Two-Piece Set',
      caption: 'প্যাস্টেল লাইল্যাক কোরিয়ান স্টাইল টু-পিস সেট। ট্রেন্ডি এস্থেটিক ও ক্যাজুয়াল আউটিংয়ের জন্য বেস্ট।',
      type: 'reel' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/reel/1399503357700927',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: '/products/cords set/911960050_2550810655401790_1836484421752711846_n.jpeg',
      durationSec: 38,
      views: '9.4K',
      likes: '720',
      isFeatured: false,
      isActive: true,
      sortOrder: 6,
      productId: products[5]?.id || null,
    },
    {
      title: 'Midnight Black Embroidered Formal Abaya',
      caption: 'মিডনাইট ব্ল্যাক ফর্মাল এমব্রয়ডার্ড আবায়া। সূক্ষ্ম কারুকাজ ও সফট প্রিমিয়াম নিদাহ ফ্যাব্রিক।',
      type: 'reel' as const,
      source: 'facebook' as const,
      facebookUrl: 'https://www.facebook.com/reel/1399503357700927',
      videoUrl: null,
      thumbnailUrl: '/products/cords set/912746948_1017483237352019_1047663584949176302_n.jpeg',
      durationSec: 45,
      views: '19.8K',
      likes: '1.9K',
      isFeatured: true,
      isActive: true,
      sortOrder: 7,
      productId: products[6]?.id || null,
    },
    {
      title: 'Thai Silk Floral Printed Co-Ord Set',
      caption: 'থাই সিল্ক ফ্লোরাল প্রিন্টেড কো-অর্ড সেট। লাইটওয়েট ও এলিগ্যান্ট গ্রীষ্ম ও শরতের নিখুঁত আউটফিট।',
      type: 'video' as const,
      source: 'upload' as const,
      facebookUrl: 'https://www.facebook.com/watch/?v=1399503357700927',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: '/products/cords set/907848890_1120439970615398_2739248965153845733_n.jpg',
      durationSec: 64,
      views: '22.3K',
      likes: '2.1K',
      isFeatured: false,
      isActive: true,
      sortOrder: 8,
      productId: products[7]?.id || null,
    },
  ];

  for (const item of sampleVideos) {
    const created = await prisma.video.create({
      data: item,
    });
    console.log(`Created video: ${created.title} (${created.id})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
