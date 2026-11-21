# Catalog seed

`catalog-seed.json` is an export of the local catalog. It contains products,
categories, brands, units, variants and product media, but no user accounts,
orders, payment records or shop settings.

To refresh it, set `DATABASE_URL` to the local source database and run
`pnpm db:export-catalog`. Inspect the generated diff before publishing it.
The exporter stops if it encounters catalog relationships it cannot yet export.

To replace a target catalog, set that environment's `DATABASE_URL` and run
`pnpm db:seed`. The replacement runs in a transaction. It deletes the old
products, categories and brands, plus related inventory logs, cart items,
order items, wholesale request items, reviews, wishlists and discount links.
It does not clone the entire database or remove the parent orders. Do not use
this command if those records must be retained.

The current snapshot uses external image URLs. If a later export contains
localhost or local-file URLs, copy the image files to the target server and
update the URLs before seeding.
