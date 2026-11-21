-- Soft-deleted products keep their records for order and audit history. Allow
-- category deletion to unlink those records without removing the products.
-- Guard: only run if category_id column still exists (older schema variants may have dropped it).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;
  END IF;
END $$;
