import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { seedAuth } from './seed-auth';

// 28 Boutique Products matching public/products/cords set/
const PRODUCTS = [
  {
    name: "Thai Cord Set — Rose Pink",
    slug: "thai-cord-set-rose-pink",
    description: "থাইল্যান্ড থেকে সরাসরি আনা প্রিমিয়াম কর্ড সেট। সফট ফেব্রিক, ট্রেন্ডি কাট ও চমৎকার ফিনিশিং। গরমে বা ক্যাজুয়াল আউটফিটের জন্য পারফেক্ট।",
    price: 2200,
    cost: 1500,
    categorySlug: "cord-sets",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/905937710_1118136247512437_2099551318531647321_n.jpg",
      "/products/cords set/906103350_1118136274179101_4099530442062694841_n.jpg",
    ],
  },
  {
    name: "Thai Cord Set — Sky Blue",
    slug: "thai-cord-set-sky-blue",
    description: "আকাশি নীল রঙের এক্সক্লুসিভ থাই কর্ড সেট। আরামদায়ক ও স্টাইলিশ ডিজাইন। Imported Thai 2-piece set in refreshing sky blue tone.",
    price: 2200,
    cost: 1500,
    categorySlug: "cord-sets",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/906103350_1118136274179101_4099530442062694841_n.jpg",
      "/products/cords set/906469184_1118136240845771_3943291408721840727_n.jpg",
    ],
  },
  {
    name: "Premium Floral Cord Dress",
    slug: "premium-floral-cord-dress",
    description: "ফ্লোরাল প্রিন্টের গর্জিয়াস কর্ড ড্রেস। বিশেষ অনুষ্ঠান ও আউটিংয়ের জন্য সেরা পছন্দ। Breathable designer dress with feminine floral accents.",
    price: 2800,
    cost: 1900,
    categorySlug: "cord-sets",
    brandSlug: "bangkok-boutique",
    images: [
      "/products/cords set/906469184_1118136240845771_3943291408721840727_n.jpg",
      "/products/cords set/906970787_1118136294179099_2969676140071058051_n.jpg",
    ],
  },
  {
    name: "Thai Cord Set — Mint Green",
    slug: "thai-cord-set-mint-green",
    description: "মিন্ট গ্রিন রঙের প্রিমিয়াম থাই কর্ড সেট। আল্ট্রা-সফট ফেব্রিক ও আধুনিক প্যাটার্ন। Cool mint green Thai coordinate set.",
    price: 2200,
    cost: 1500,
    categorySlug: "cord-sets",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/906970787_1118136294179099_2969676140071058051_n.jpg",
      "/products/cords set/907179635_1119377164055012_4690738175147170981_n.jpg",
    ],
  },
  {
    name: "Designer Cord Set — Lavender",
    slug: "designer-cord-set-lavender",
    description: "ল্যাভেন্ডার প্যাস্টেল শেডের ডিজাইনার কর্ড সেট। ব্যাংককের আধুনিক ফ্যাশন ট্রেন্ড। Chic pastel lavender cord outfit.",
    price: 2500,
    cost: 1700,
    categorySlug: "cord-sets",
    brandSlug: "bangkok-boutique",
    images: [
      "/products/cords set/907179635_1119377164055012_4690738175147170981_n.jpg",
      "/products/cords set/907179696_1120440083948720_7963413112182328795_n.jpg",
    ],
  },
  {
    name: "Classic Beige Casual Cord Set",
    slug: "classic-beige-casual-cord-set",
    description: "বুনন ও ফিনিশিংয়ে আভিজাত্যের ছোঁয়া। বেইজ কালারের অল-সিজন প্রিমিয়াম ওয়্যার। Neutral beige coordinate set for versatile style.",
    price: 2300,
    cost: 1600,
    categorySlug: "cord-sets",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/907179696_1120440083948720_7963413112182328795_n.jpg",
      "/products/cords set/907385142_1119561854036543_4006898923496413414_n.jpg",
    ],
  },
  {
    name: "Printed Boho Cord Two-Piece",
    slug: "printed-boho-cord-two-piece",
    description: "বোহো প্রিন্টের ট্রেন্ডি টু-পিস সেট। পার্টি বা ফটোশুটের জন্য আকর্ষণীয় লুক। Artistic bohemian print two-piece.",
    price: 2600,
    cost: 1800,
    categorySlug: "cord-sets",
    brandSlug: "bangkok-boutique",
    images: [
      "/products/cords set/907385142_1119561854036543_4006898923496413414_n.jpg",
      "/products/cords set/907405935_1115282814464447_1437912009837912524_n.jpg",
    ],
  },
  {
    name: "Thai Silk Cord Lounge Set",
    slug: "thai-silk-cord-lounge-set",
    description: "সিল্কি সফট টেক্সচার ও আরামদায়ক ফিটিং। প্রিমিয়াম ব্যাংকক লাউঞ্জ কালেকশন। Luxury soft-silk touch lounge cord set.",
    price: 2700,
    cost: 1850,
    categorySlug: "cord-sets",
    brandSlug: "thai-silk-linen",
    images: [
      "/products/cords set/907405935_1115282814464447_1437912009837912524_n.jpg",
      "/products/cords set/907641467_1120440070615388_2107924479017573990_n.jpg",
    ],
  },
  // ── 2. PARTY GOWNS ─────────────────────────────────────────────────────────────
  {
    name: "Royal Velvet Party Gown — Crimson",
    slug: "royal-velvet-party-gown-crimson",
    description: "ক্রিমসন রেড প্রিমিয়াম ভেলভেট গাউন। বিয়ে বা রাতের পার্টির জন্য চমৎকার গ্ল্যামারাস সাজ। Heavy flare crimson velvet gown with rich luster.",
    price: 4500,
    cost: 3200,
    categorySlug: "party-gowns",
    brandSlug: "royal-velvet-edit",
    images: [
      "/products/cords set/907641467_1120440070615388_2107924479017573990_n.jpg",
      "/products/cords set/910465086_1119291994063529_6730173952863950097_n.jpg",
    ],
  },
  {
    name: "Embroidered Anarkali Gown — Emerald",
    slug: "embroidered-anarkali-gown-emerald",
    description: "পান্না সবুজ রঙের এমব্রয়ডারি আনারকলি গাউন। গর্জিয়াস কাজের সাথে রাজকীয় অনুভূতির সমন্বয়। Emerald green festive anarkali with detailed zaree work.",
    price: 5200,
    cost: 3800,
    categorySlug: "party-gowns",
    brandSlug: "pakistani-designer",
    images: [
      "/products/cords set/910465086_1119291994063529_6730173952863950097_n.jpg",
      "/products/cords set/910465283_1121429233849805_1193318539780352366_n.jpg",
    ],
  },
  {
    name: "Tiered Organza Festive Gown",
    slug: "tiered-organza-festive-gown",
    description: "টিয়ার্ড অর্গানজা ফ্লেয়ার পার্টি গাউন। ডেলিকট ফ্রিল ও আধুনিক বুটিক ডিজাইন। Voluminous tiered organza evening gown.",
    price: 4800,
    cost: 3500,
    categorySlug: "party-gowns",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/910465283_1121429233849805_1193318539780352366_n.jpg",
      "/products/cords set/913180013_1120115427314519_7306115019982798276_n.jpg",
    ],
  },
  {
    name: "Midnight Blue Sequin Party Gown",
    slug: "midnight-blue-sequin-party-gown",
    description: "সিকুইন কাজের গর্জিয়াস মিডনাইট ব্লু গাউন। যেকোনো গালা ইভেন্টে নজরকাড়া উপস্থিতি। Shimmering sequin embellished navy gown.",
    price: 5500,
    cost: 4000,
    categorySlug: "party-gowns",
    brandSlug: "royal-velvet-edit",
    images: [
      "/products/cords set/913180013_1120115427314519_7306115019982798276_n.jpg",
      "/products/cords set/916496639_2050418568951611_3231227725146044425_n.jpeg",
    ],
  },
  {
    name: "Golden Champagne Silk Gown",
    slug: "golden-champagne-silk-gown",
    description: "শ্যাম্পেন গোল্ডেন শেডের প্রিমিয়াম সিল্ক গাউন। আভিজাত্য ও কমনীয়তার এক অপূর্ব মেলবন্ধন। Champagne silk maxi gown with refined silhouette.",
    price: 4200,
    cost: 3000,
    categorySlug: "party-gowns",
    brandSlug: "thai-silk-linen",
    images: [
      "/products/cords set/916496639_2050418568951611_3231227725146044425_n.jpeg",
      "/products/cords set/907710748_1120440017282060_7568019241650380073_n.jpg",
    ],
  },
  // ── 3. LUXURY ABAYAS ──────────────────────────────────────────────────────────
  {
    name: "Dubai Front-Open Shrug Abaya",
    slug: "dubai-front-open-shrug-abaya",
    description: "দুবাই স্টাইল ফ্রন্ট-ওপেন কাফতান আবায়া। সঙ্গে ম্যাচিং ইনার ও হিজাব। মার্জিত ও রাজকীয় লুক। Contemporary open-front Dubai shrug abaya.",
    price: 3600,
    cost: 2500,
    categorySlug: "luxury-abayas",
    brandSlug: "dubai-modest-wear",
    images: [
      "/products/cords set/907710748_1120440017282060_7568019241650380073_n.jpg",
      "/products/cords set/910779035_1119402200719175_1380832213076202045_n.jpg",
    ],
  },
  {
    name: "Embroidered Nidha Abaya — Black",
    slug: "embroidered-nidha-abaya-black",
    description: "অরিজিনাল নিদা ফেব্রিকের কালো আবায়া। হাতার সূক্ষ্ম এমব্রয়ডারি কাজের সৌন্দর্য। Premium Korean Nidha fabric classic black abaya.",
    price: 3800,
    cost: 2700,
    categorySlug: "luxury-abayas",
    brandSlug: "dubai-modest-wear",
    images: [
      "/products/cords set/910779035_1119402200719175_1380832213076202045_n.jpg",
      "/products/cords set/911444036_1120115507314511_5435483419353914143_n.jpg",
    ],
  },
  {
    name: "Two-Tone Georgette Modest Borka",
    slug: "two-tone-georgette-modest-borka",
    description: "ডাবল লেয়ার প্রিমিয়াম জর্জেট বোরকা। আরামদায়ক ও ফুল কভারেজ ফ্যাশন। Dual tone fluid georgette modest outerwear.",
    price: 3200,
    cost: 2200,
    categorySlug: "luxury-abayas",
    brandSlug: "dubai-modest-wear",
    images: [
      "/products/cords set/911444036_1120115507314511_5435483419353914143_n.jpg",
      "/products/cords set/907848890_1120439970615398_2739248965153845733_n.jpg",
    ],
  },
  {
    name: "Pearl-Studded Modest Kimono Abaya",
    slug: "pearl-studded-modest-kimono-abaya",
    description: "হাতে বসানো মুক্তার কাজের কিমোনো স্টাইল আবায়া। যেকোনো অনুষ্ঠানে পরার উপযোগী। Pearl embellished flared kimono abaya.",
    price: 4200,
    cost: 3000,
    categorySlug: "luxury-abayas",
    brandSlug: "dubai-modest-wear",
    images: [
      "/products/cords set/907848890_1120439970615398_2739248965153845733_n.jpg",
      "/products/cords set/911960050_2550810655401790_1836484421752711846_n.jpeg",
    ],
  },
  // ── 4. VELVET COLLECTION ──────────────────────────────────────────────────────
  {
    name: "Royal Maroon Velvet Kurti Set",
    slug: "royal-maroon-velvet-kurti-set",
    description: "মেরুন কালারের ভেলভেট কুর্তি ও ট্রাউজার সেট। শীতের পার্টির জন্য পারফেক্ট। Plush maroon velvet kurti paired with fitted trousers.",
    price: 3500,
    cost: 2400,
    categorySlug: "velvet-collection",
    brandSlug: "royal-velvet-edit",
    images: [
      "/products/cords set/911960050_2550810655401790_1836484421752711846_n.jpeg",
      "/products/cords set/910464923_1119402197385842_1032682198169436641_n.jpg",
    ],
  },
  {
    name: "Embossed Velvet Long Kaftan",
    slug: "embossed-velvet-long-kaftan",
    description: "এমবসড ভেলভেটের রাজকীয় কাফতান ড্রেস। আরাম ও আভিজাত্য একসাথে। Embossed textured velvet kaftan with gold piping.",
    price: 3900,
    cost: 2800,
    categorySlug: "velvet-collection",
    brandSlug: "royal-velvet-edit",
    images: [
      "/products/cords set/910464923_1119402197385842_1032682198169436641_n.jpg",
      "/products/cords set/912746948_1017483237352019_1047663584949176302_n.jpeg",
    ],
  },
  {
    name: "Velvet Shawl & Three-Piece Suit",
    slug: "velvet-shawl-three-piece-suit",
    description: "হেভি কাশ্মীরি এমব্রয়ডারি ভেলভেট শাল সহ ৩-পিস স্যুট। উৎসবের অন্যতম আকর্ষণ। Pure velvet shawl with embroidered formal 3-piece.",
    price: 4900,
    cost: 3500,
    categorySlug: "velvet-collection",
    brandSlug: "pakistani-designer",
    images: [
      "/products/cords set/912746948_1017483237352019_1047663584949176302_n.jpeg",
      "/products/cords set/907061818_1844070429948250_573790682602829700_n.jpeg",
    ],
  },
  // ── 5. WINTER COLLECTION ──────────────────────────────────────────────────────
  {
    name: "Chita Print Long Trench Coat",
    slug: "chita-print-long-trench-coat",
    description: "চিটা প্রিন্ট ফ্যাশন কোট — ট্রেন্ডি কাট, হাই কোয়ালিটি ইনার লাইনিং ও আকর্ষণীয় বেল্ট। Statement leopard-pattern long fashion coat.",
    price: 3400,
    cost: 2300,
    categorySlug: "winter-collection",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/916496639_2050418568951611_3231227725146044425_n.jpeg",
      "/products/cords set/907061818_1844070429948250_573790682602829700_n.jpeg",
    ],
  },
  {
    name: "Cozy Fleece Sweatshirt Cord Set",
    slug: "cozy-fleece-sweatshirt-cord-set",
    description: "শীতের ট্রেন্ডি ফ্লিস ফ্যাব্রিক কর্ড সেট। উষ্ণ ও ক্যাজুয়াল স্টাইলিশ আউটফিট। Warm fleece winter cord suit.",
    price: 2400,
    cost: 1600,
    categorySlug: "winter-collection",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/907061818_1844070429948250_573790682602829700_n.jpeg",
      "/products/cords set/913775534_2996058200758228_7096304065656903894_n.jpeg",
    ],
  },
  {
    name: "Quilted Winter Bomber Jacket",
    slug: "quilted-winter-bomber-jacket",
    description: "কুইল্টেড প্যাটার্নের ট্রেন্ডি জ্যাকেট। স্মার্ট উইন্টার ওয়্যার। Premium quilted winter streetwear jacket.",
    price: 2900,
    cost: 2000,
    categorySlug: "winter-collection",
    brandSlug: "bangkok-boutique",
    images: [
      "/products/cords set/913775534_2996058200758228_7096304065656903894_n.jpeg",
      "/products/cords set/910577619_1744237410605617_7176105607438051640_n.jpeg",
    ],
  },
  // ── 6. DESIGNER 3-PIECE ───────────────────────────────────────────────────────
  {
    name: "Pakistani Designer Lawn 3-Piece",
    slug: "pakistani-designer-lawn-3-piece",
    description: "ডিজিটাল প্রিন্ট লন কামিজ, শিফন ওড়না ও ট্রাউজার। প্রিমিয়াম পাকিস্তানি লন। Premium printed lawn suit with embroidered neckline.",
    price: 3200,
    cost: 2200,
    categorySlug: "designer-3piece",
    brandSlug: "pakistani-designer",
    images: [
      "/products/cords set/906970787_1118136294179099_2969676140071058051_n.jpg",
      "/products/cords set/910577619_1744237410605617_7176105607438051640_n.jpeg",
    ],
  },
  {
    name: "Silk Georgette Festive 3-Piece",
    slug: "silk-georgette-festive-3-piece",
    description: "সিল্ক জর্জেটের গর্জিয়াস ৩-পিস সেট। ভারী কাজের ওড়না ও আরামদায়ক ট্রাউজার। Festive georgette 3-piece with heavy dupatta.",
    price: 3600,
    cost: 2500,
    categorySlug: "designer-3piece",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/910577619_1744237410605617_7176105607438051640_n.jpeg",
      "/products/cords set/911689316_1120439967282065_7084200797512321205_n.jpg",
    ],
  },
  // ── 7. CASUAL & MODEST ────────────────────────────────────────────────────────
  {
    name: "Modest Flared Maxi Dress",
    slug: "modest-flared-maxi-dress",
    description: "ফুল কভারেজ ফ্লেয়ার্ড ম্যাক্সি ড্রেস। আরামদায়ক কটন-লিনেন ফেব্রিক। Elegant breathable modest maxi dress.",
    price: 2400,
    cost: 1600,
    categorySlug: "casual-modest",
    brandSlug: "bangkok-boutique",
    images: [
      "/products/cords set/907848890_1120439970615398_2739248965153845733_n.jpg",
      "/products/cords set/911689316_1120439967282065_7084200797512321205_n.jpg",
    ],
  },
  {
    name: "Peplum Top & Trouser Coordinate",
    slug: "peplum-top-trouser-coordinate",
    description: "পেপলাম টপ ও ম্যাচিং ট্রাউজার সেট। ক্যাজুয়াল অফিস বা বন্ধুদের আড্ডার জন্য সেরা। Tailored peplum co-ord set.",
    price: 2300,
    cost: 1550,
    categorySlug: "casual-modest",
    brandSlug: "mini-thailand-exclusive",
    images: [
      "/products/cords set/911689316_1120439967282065_7084200797512321205_n.jpg",
      "/products/cords set/914966927_1119561824036546_6782715417567542476_n.jpg",
    ],
  },
  // ── 8. HIJABS & SCARVES ───────────────────────────────────────────────────────
  {
    name: "Premium Turkish Chiffon Hijab",
    slug: "premium-turkish-chiffon-hijab",
    description: "তুর্কি শিফন হিজাব — সফট ও নন-স্লিপ টেক্সচার। দৈনন্দিন ও পার্টির জন্য পারফেক্ট। Turkish non-slip soft chiffon hijab.",
    price: 650,
    cost: 400,
    categorySlug: "hijabs-scarves",
    brandSlug: "dubai-modest-wear",
    images: [
      "/products/cords set/911960050_2550810655401790_1836484421752711846_n.jpeg",
      "/products/cords set/914966927_1119561824036546_6782715417567542476_n.jpg",
    ],
  },
];

const CATEGORIES = [
  { name: "Cord Sets", slug: "cord-sets", sortOrder: 1, imageUrl: "/products/cords set/905937710_1118136247512437_2099551318531647321_n.jpg" },
  { name: "Party Gowns", slug: "party-gowns", sortOrder: 2, imageUrl: "/products/cords set/907179635_1119377164055012_4690738175147170981_n.jpg" },
  { name: "Luxury Abayas", slug: "luxury-abayas", sortOrder: 3, imageUrl: "/products/cords set/910465086_1119291994063529_6730173952863950097_n.jpg" },
  { name: "Velvet Collection", slug: "velvet-collection", sortOrder: 4, imageUrl: "/products/cords set/913180013_1120115427314519_7306115019982798276_n.jpg" },
  { name: "Winter Collection", slug: "winter-collection", sortOrder: 5, imageUrl: "/products/cords set/916496639_2050418568951611_3231227725146044425_n.jpeg" },
  { name: "Designer 3-Piece", slug: "designer-3piece", sortOrder: 6, imageUrl: "/products/cords set/906970787_1118136294179099_2969676140071058051_n.jpg" },
  { name: "Casual & Modest", slug: "casual-modest", sortOrder: 7, imageUrl: "/products/cords set/907848890_1120439970615398_2739248965153845733_n.jpg" },
  { name: "Hijabs & Scarves", slug: "hijabs-scarves", sortOrder: 8, imageUrl: "/products/cords set/911960050_2550810655401790_1836484421752711846_n.jpeg" },
];

const BRANDS = [
  { name: "Mini Thailand Exclusive", slug: "mini-thailand-exclusive" },
  { name: "Bangkok Boutique", slug: "bangkok-boutique" },
  { name: "Dubai Modest Wear", slug: "dubai-modest-wear" },
  { name: "Pakistani Designer", slug: "pakistani-designer" },
  { name: "Royal Velvet Edit", slug: "royal-velvet-edit" },
  { name: "Thai Silk & Linen", slug: "thai-silk-linen" },
];

const CAMPAIGNS = [
  {
    title: "Cocoa Blazer Lace Set",
    description: "Tailored lace blazer with a satin tie-belt and a flowing skirt for evening occasions.",
    status: "active",
    hasDiscount: true,
    image: "/images/campaigns/hero-cocoa-blazer-lace-set.jpg",
  },
  {
    title: "Blush Bloom Embroidery",
    description: "Delicate floral embroidery in a soft blush tone, a graceful pick for every festive occasion.",
    status: "active",
    hasDiscount: true,
    image: "/images/campaigns/hero-blush-bloom-embroidery.jpg",
  },
  {
    title: "Wine Lace Evening Set",
    description: "Beaded floral lace top with a flowing satin skirt, made to stand out at every gathering.",
    status: "active",
    hasDiscount: true,
    image: "/images/campaigns/hero-wine-lace-evening-set.jpg",
  },
  {
    title: "Midnight Bloom Set",
    description: "Elegant black floral print, soft and effortless. Made for every day and every occasion.",
    status: "active",
    hasDiscount: false,
    image: "/images/campaigns/hero-midnight-bloom-set.jpg",
  },
  {
    title: "Mocha Lace Co-ord Set",
    description: "Intricate lace with statement buttons, graceful for celebrations and special days.",
    status: "active",
    hasDiscount: true,
    image: "/images/campaigns/hero-mocha-lace-coord-set.jpg",
  },
  {
    title: "Crimson Lace Edit",
    description: "Romantic red lace with a tie-waist silhouette, made for celebrations and special evenings.",
    status: "active",
    hasDiscount: true,
    image: "/images/campaigns/hero-crimson-lace-edit.jpg",
  },
  {
    title: "Exclusive Thai Cord Sets Collection",
    description: "সরাসরি ব্যাংকক থেকে আনা ১০০% অরিজিনাল সফট প্রিমিয়াম কর্ড সেট — ট্রেন্ডি ডিজাইন ও অতুলনীয় আরাম। সীমিত স্টক, এখনই অর্ডার করুন।",
    status: "active",
    hasDiscount: true,
    image: "/products/cords set/905937710_1118136247512437_2099551318531647321_n.jpg",
  },
  {
    title: "Luxury Velvet & Festive Party Gowns",
    description: "যেকোনো বিয়ে ও পার্টির জন্য সম্পূর্ণ রাজকীয় সাজ — এক্সক্লুসিভ ভেলভেট, এমব্রয়ডারি ও গর্জিয়াস টিয়ার্ড গাউন।",
    status: "active",
    hasDiscount: true,
    image: "/products/cords set/907179635_1119377164055012_4690738175147170981_n.jpg",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log("🌱 Starting Boutique database seed...");

    // 1. Seed Roles & Auth
    await seedAuth(prisma);

    // 2. Unit
    const unit = await prisma.unit.upsert({
      where: { abbreviation: "pcs" },
      update: { name: "Pieces", isActive: true },
      create: { name: "Pieces", abbreviation: "pcs", factor: 1, isActive: true },
    });

    // 3. Categories
    const categoryMap = new Map<string, string>();
    for (const cat of CATEGORIES) {
      const record = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, imageUrl: cat.imageUrl, sortOrder: cat.sortOrder },
        create: { name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl, sortOrder: cat.sortOrder },
      });
      categoryMap.set(cat.slug, record.id);
    }
    console.log(`✅ Seeded ${categoryMap.size} categories`);

    // 4. Brands
    const brandMap = new Map<string, string>();
    for (const b of BRANDS) {
      const record = await prisma.brand.upsert({
        where: { slug: b.slug },
        update: { name: b.name },
        create: { name: b.name, slug: b.slug },
      });
      brandMap.set(b.slug, record.id);
    }
    console.log(`✅ Seeded ${brandMap.size} brands`);

    // 5. Section & Campaigns
    let section = await prisma.section.findFirst({ where: { page: "home" } });
    if (!section) {
      section = await prisma.section.create({
        data: { id: "sec-hero", position: 1, title: "Hero Campaign", page: "home" },
      });
    }

    // Clean existing campaigns and insert boutique campaigns
    await prisma.campaignImage.deleteMany();
    await prisma.campaign.deleteMany();

    for (const c of CAMPAIGNS) {
      const campaign = await prisma.campaign.create({
        data: {
          title: c.title,
          description: c.description,
          hasDiscount: c.hasDiscount,
          status: c.status,
          startAt: new Date(),
          sectionId: section.id,
        },
      });
      await prisma.campaignImage.create({
        data: {
          campaignId: campaign.id,
          images: [c.image],
        },
      });
    }
    console.log(`✅ Seeded ${CAMPAIGNS.length} hero campaigns`);

    // 6. Products
    let productCount = 0;
    for (const p of PRODUCTS) {
      const categoryId = categoryMap.get(p.categorySlug);
      const brandId = brandMap.get(p.brandSlug);
      if (!brandId) continue;

      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          description: p.description,
          status: "active",
          categoryId: categoryId || null,
          brandId,
          unitId: unit.id,
        },
        create: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          status: "active",
          categoryId: categoryId || null,
          brandId,
          unitId: unit.id,
        },
      });

      // Default Variant
      const sku = `MT-${p.slug.toUpperCase().slice(0, 10)}-${product.id.slice(0, 4)}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          price: p.price,
          cost: p.cost,
          stockQuantity: 50,
          isDefault: true,
        },
        create: {
          sku,
          price: p.price,
          cost: p.cost,
          stockQuantity: 50,
          isDefault: true,
          productId: product.id,
        },
      });

      // Media
      for (let i = 0; i < p.images.length; i++) {
        const imgUrl = p.images[i];
        let media = await prisma.media.findFirst({ where: { url: imgUrl } });
        if (!media) {
          media = await prisma.media.create({
            data: {
              url: imgUrl,
              type: "image",
              provider: "local",
            },
          });
        }
        const existingPm = await prisma.productMedia.findFirst({
          where: { productId: product.id, mediaId: media.id },
        });
        if (!existingPm) {
          await prisma.productMedia.create({
            data: {
              productId: product.id,
              mediaId: media.id,
              isFeatured: i === 0,
            },
          });
        }
      }

      productCount++;
    }
    console.log(`✅ Seeded ${productCount} boutique products with variants and media`);
    console.log("🎉 Seeding completed successfully!");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
});
