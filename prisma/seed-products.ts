import fs from 'fs';
import path from 'path';
import type { PrismaClient } from '../src/generated/prisma/client';

type Row = Record<string, unknown>;
type Catalog = {
  version: number;
  categories: Row[];
  brands: Row[];
  units: Row[];
  products: Row[];
  product_variants: Row[];
  product_media: Row[];
  media: Row[];
};

/** Replace the catalog from the explicitly exported local database snapshot. */
export async function seedProducts(prisma: PrismaClient): Promise<void> {
  const file = path.join(__dirname, 'catalog-seed.json');
  if (!fs.existsSync(file)) throw new Error('Missing prisma/catalog-seed.json; export the local catalog first');
  const catalog = JSON.parse(fs.readFileSync(file, 'utf8')) as Catalog;
  const names = ['categories', 'brands', 'units', 'products', 'product_variants', 'product_media', 'media'] as const;
  if (catalog.version !== 1 || names.some(name => !Array.isArray(catalog[name])) || !catalog.products.length || !catalog.categories.length) {
    throw new Error('Invalid or empty catalog snapshot');
  }

  await prisma.$transaction(async tx => {
    // Products and variants are referenced by transactional records. This
    // replacement intentionally removes those records, as authorized.
    await tx.inventoryLog.deleteMany();
    await tx.productVariantAttribute.deleteMany();
    await tx.productVariantMedia.deleteMany();
    await tx.cartItem.deleteMany();
    await tx.wholesaleOrderRequestItem.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.productVariant.deleteMany();
    await tx.productMedia.deleteMany();
    await tx.discountProduct.deleteMany();
    await tx.wishlist.deleteMany();
    await tx.review.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();
    await tx.brand.deleteMany();

    // Table names are fixed in code; row data is sent as a SQL parameter.
    const insert = async (table: string, row: Row, suffix = '') => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "${table}" SELECT (json_populate_record(NULL::"${table}", $1::json)).* ${suffix}`,
        JSON.stringify(row),
      );
    };
    const unitIds = new Map<string, string>();
    for (const unit of catalog.units) {
      const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO "units" SELECT (json_populate_record(NULL::"units", $1::json)).* ON CONFLICT (abbreviation) DO UPDATE SET name=EXCLUDED.name, factor=EXCLUDED.factor, is_active=EXCLUDED.is_active RETURNING id`,
        JSON.stringify(unit),
      );
      unitIds.set(String(unit.id), rows[0].id);
    }
    for (const row of catalog.categories) await insert('categories', row);
    for (const row of catalog.brands) await insert('brands', row);
    for (const row of catalog.products) {
      const unitId = row.unit_id == null ? null : unitIds.get(String(row.unit_id));
      if (row.unit_id != null && !unitId) throw new Error(`Missing unit for product ${row.id}`);
      await insert('products', { ...row, unit_id: unitId });
    }
    for (const row of catalog.product_variants) await insert('product_variants', row);
    for (const row of catalog.media) {
      await insert('media', row, 'ON CONFLICT (id) DO UPDATE SET url=EXCLUDED.url, type=EXCLUDED.type, provider=EXCLUDED.provider');
    }
    for (const row of catalog.product_media) await insert('product_media', row);
  }, { timeout: 120000, maxWait: 10000 });

  console.log(`Catalog seeded: ${catalog.categories.length} categories, ${catalog.products.length} products, ${catalog.product_media.length} product images.`);
}
