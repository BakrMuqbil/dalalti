# Store Theme — Manual Supabase Migration

## 1. Execute SQL

Open Supabase → SQL Editor and run:

`003_store_theme.sql`

This creates `store_themes`, inserts a default row for existing stores, and adds an `updated_at` trigger.

## 2. Generate Prisma Client

After the SQL succeeds, from the project root run:

```bash
npx prisma generate
```

The generated client must be refreshed because `StoreTheme` is a new Prisma model.

## 3. Verify

Run:

```sql
select
  store_id,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color
from store_themes
order by created_at desc;
```

## 4. TypeScript

```bash
npx tsc --noEmit
```

Expected: exit code 0.

## Scope

This feature changes only Store Theme / Store Appearance.

It does not implement or modify:
- Checkout 3 / Delivery
- Checkout 4 / Payment
- Email
- Payment gateways
