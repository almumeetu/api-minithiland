// Export only catalog data; no users, orders, passwords or settings.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const checks = [
      ['nested categories', 'SELECT count(*) AS n FROM categories WHERE "parentId" IS NOT NULL'],
      ['nested units', 'SELECT count(*) AS n FROM units WHERE parent_id IS NOT NULL'],
      ['product suppliers', 'SELECT count(*) AS n FROM products WHERE deleted_at IS NULL AND supplier_id IS NOT NULL'],
      ['product tags', 'SELECT count(*) AS n FROM "_ProductToTag"'],
      ['variant attributes', 'SELECT count(*) AS n FROM product_variant_attributes'],
      ['variant media', 'SELECT count(*) AS n FROM product_variant_media'],
    ];
    for (const [label, sql] of checks) {
      const result = await db.query(sql);
      if (Number(result.rows[0].n)) throw new Error(`Export does not yet support ${label}`);
    }
    const queries = {
      categories: 'SELECT * FROM categories ORDER BY id',
      brands: 'SELECT * FROM brands ORDER BY id',
      units: 'SELECT * FROM units ORDER BY id',
      products: 'SELECT * FROM products WHERE deleted_at IS NULL ORDER BY id',
      product_variants: 'SELECT v.* FROM product_variants v JOIN products p ON p.id=v."productId" WHERE p.deleted_at IS NULL ORDER BY v.id',
      product_media: 'SELECT pm.* FROM product_media pm JOIN products p ON p.id=pm."productId" WHERE p.deleted_at IS NULL ORDER BY pm.id',
      media: 'SELECT m.* FROM media m WHERE EXISTS (SELECT 1 FROM product_media pm JOIN products p ON p.id=pm."productId" WHERE pm."mediaId"=m.id AND p.deleted_at IS NULL) ORDER BY m.id',
    };
    const data = { version: 1 };
    for (const [name, sql] of Object.entries(queries)) data[name] = (await db.query(sql)).rows;
    if (!data.products.length || !data.categories.length) throw new Error('Source catalog is empty');
    const imageUrls = [
      ...data.categories.map(row => row.image_url),
      ...data.brands.map(row => row.logo_url),
      ...data.media.map(row => row.url),
    ].filter(Boolean);
    for (const value of imageUrls) {
      let url;
      try { url = new URL(value); } catch { throw new Error('Relative image URL found; move images to public storage before exporting'); }
      if (!['http:', 'https:'].includes(url.protocol) || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
        throw new Error('Local image URL found; move images to public storage before exporting');
      }
    }
    await db.query('COMMIT');
    const dest = path.join(__dirname, '../prisma/catalog-seed.json');
    const temp = `${dest}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n');
    fs.renameSync(temp, dest);
    console.log(`Exported ${data.products.length} products, ${data.categories.length} categories and ${data.product_media.length} product images to ${dest}`);
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await db.end();
  }
}
main().catch(error => { console.error('Catalog export failed:', error.message); process.exitCode = 1; });
