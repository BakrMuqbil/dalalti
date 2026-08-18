-- =========================================================
-- Dalalti — Public Storefront Purchase Flow
-- E1-E8: customer contact, shipping snapshot, delivery/payment
-- and secure public order confirmation access.
-- =========================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_area text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS shipping_notes text,
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'DELIVERY',
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'CASH_ON_DELIVERY',
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS public_access_token text;

UPDATE orders
SET delivery_method = 'DELIVERY'
WHERE delivery_method IS NULL;

UPDATE orders
SET payment_method = 'CASH_ON_DELIVERY'
WHERE payment_method IS NULL;

UPDATE orders
SET shipping_fee = 0
WHERE shipping_fee IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_access_token
  ON orders(public_access_token);

CREATE INDEX IF NOT EXISTS idx_orders_delivery_method
  ON orders(store_id, delivery_method);

CREATE INDEX IF NOT EXISTS idx_orders_payment_method
  ON orders(store_id, payment_method);

ALTER TABLE orders
  ADD CONSTRAINT orders_delivery_method_check
  CHECK (delivery_method IN ('DELIVERY'));

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('CASH_ON_DELIVERY'));

ALTER TABLE orders
  ADD CONSTRAINT orders_shipping_fee_check
  CHECK (shipping_fee >= 0);
