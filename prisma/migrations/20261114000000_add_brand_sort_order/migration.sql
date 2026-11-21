ALTER TABLE "brands" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Give existing brands a stable initial order, with newer brands first.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      ORDER BY "created_at" DESC, "id" ASC
    ) - 1 AS rn
  FROM "brands"
)
UPDATE "brands" b
SET "sort_order" = ranked.rn
FROM ranked
WHERE b."id" = ranked."id";
