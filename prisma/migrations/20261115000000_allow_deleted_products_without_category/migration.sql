-- Soft-deleted products keep their records for order and audit history. Allow
-- category deletion to unlink those records without removing the products.
ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;
