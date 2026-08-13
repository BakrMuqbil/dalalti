-- =========================================================
-- Dalalti
-- Initial Database Schema
-- Migration: 001_initial
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- ENUMS
-- =========================================================

create type user_role as enum (
  'ADMIN',
  'STORE_OWNER'
);

create type store_status as enum (
  'ACTIVE',
  'SUSPENDED'
);

create type subscription_status as enum (
  'ACTIVE',
  'EXPIRED',
  'CANCELLED'
);

create type billing_period as enum (
  'MONTHLY',
  'YEARLY'
);

create type product_status as enum (
  'ACTIVE',
  'INACTIVE'
);

create type product_availability as enum (
  'AVAILABLE',
  'UNAVAILABLE'
);

create type order_status as enum (
  'NEW',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'DELIVERED',
  'CANCELLED'
);


-- =========================================================
-- USERS
-- Platform administrators and store owners
-- =========================================================

create table users (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  phone text unique,

  email text unique,

  password_hash text not null,

  role user_role not null default 'STORE_OWNER',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- =========================================================
-- PLANS
-- Subscription plans managed by the platform owner
-- =========================================================

create table plans (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  billing_period billing_period not null,

  price numeric(12,2) not null
    check (price >= 0),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (name, billing_period)
);


-- =========================================================
-- STORES
-- Each store belongs to one store owner
-- =========================================================

create table stores (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null unique
    references users(id)
    on delete restrict,

  name text not null,

  slug text not null unique,

  description text,

  logo_url text,

  phone text,

  status store_status not null default 'ACTIVE',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index idx_stores_owner_id
  on stores(owner_id);

create index idx_stores_status
  on stores(status);


-- =========================================================
-- SUBSCRIPTIONS
-- Each store has one current subscription in MVP
-- =========================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null unique
    references stores(id)
    on delete restrict,

  plan_id uuid not null
    references plans(id)
    on delete restrict,

  status subscription_status not null default 'ACTIVE',

  starts_at timestamptz not null,

  ends_at timestamptz not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  check (ends_at > starts_at)
);

create index idx_subscriptions_status
  on subscriptions(status);

create index idx_subscriptions_ends_at
  on subscriptions(ends_at);


-- =========================================================
-- CATEGORIES
-- Supports main categories and subcategories
--
-- parent_id = NULL  → Main category
-- parent_id != NULL → Subcategory
-- =========================================================

create table categories (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null
    references stores(id)
    on delete cascade,

  parent_id uuid
    references categories(id)
    on delete cascade,

  name text not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (store_id, name)
);

create index idx_categories_store_id
  on categories(store_id);

create index idx_categories_parent_id
  on categories(parent_id);


-- =========================================================
-- PRODUCTS
-- =========================================================

create table products (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null
    references stores(id)
    on delete cascade,

  category_id uuid
    references categories(id)
    on delete set null,

  name text not null,

  description text,

  price numeric(12,2) not null
    check (price >= 0),

  availability product_availability
    not null default 'AVAILABLE',

  status product_status
    not null default 'ACTIVE',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index idx_products_store_id
  on products(store_id);

create index idx_products_category_id
  on products(category_id);

create index idx_products_availability
  on products(store_id, availability);

create index idx_products_status
  on products(store_id, status);


-- =========================================================
-- PRODUCT IMAGES
-- A product can have multiple images
-- =========================================================

create table product_images (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references products(id)
    on delete cascade,

  image_url text not null,

  sort_order integer not null default 0
    check (sort_order >= 0),

  is_primary boolean not null default false,

  created_at timestamptz not null default now()
);

create index idx_product_images_product_id
  on product_images(product_id);

create index idx_product_images_sort_order
  on product_images(product_id, sort_order);


-- =========================================================
-- PRODUCT VARIANTS
--
-- Used for:
-- Color
-- Size
-- Availability
--
-- Example:
-- Red / Large / Available
-- Black / Medium / Available
-- =========================================================

create table product_variants (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references products(id)
    on delete cascade,

  color text,

  size text,

  price numeric(12,2)
    check (price >= 0),

  availability product_availability
    not null default 'AVAILABLE',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (product_id, color, size)
);

create index idx_product_variants_product_id
  on product_variants(product_id);

create index idx_product_variants_availability
  on product_variants(product_id, availability);


-- =========================================================
-- CUSTOMERS
-- Customers belonging to a specific store
-- =========================================================

create table customers (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null
    references stores(id)
    on delete cascade,

  name text not null,

  phone text not null,

  address text,

  notes text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index idx_customers_store_id
  on customers(store_id);

create index idx_customers_phone
  on customers(store_id, phone);


-- =========================================================
-- ORDERS
-- =========================================================

create table orders (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null
    references stores(id)
    on delete cascade,

  customer_id uuid not null
    references customers(id)
    on delete restrict,

  status order_status not null default 'NEW',

  total_amount numeric(12,2) not null
    check (total_amount >= 0),

  notes text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index idx_orders_store_id
  on orders(store_id);

create index idx_orders_customer_id
  on orders(customer_id);

create index idx_orders_status
  on orders(store_id, status);

create index idx_orders_created_at
  on orders(store_id, created_at desc);


-- =========================================================
-- ORDER ITEMS
--
-- Important:
-- unit_price and total_price are snapshots.
--
-- If the product price changes later,
-- old orders remain unchanged.
-- =========================================================

create table order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references orders(id)
    on delete cascade,

  product_id uuid not null
    references products(id)
    on delete restrict,

  variant_id uuid
    references product_variants(id)
    on delete restrict,

  quantity integer not null
    check (quantity > 0),

  unit_price numeric(12,2) not null
    check (unit_price >= 0),

  total_price numeric(12,2) not null
    check (total_price >= 0),

  created_at timestamptz not null default now()
);

create index idx_order_items_order_id
  on order_items(order_id);

create index idx_order_items_product_id
  on order_items(product_id);

create index idx_order_items_variant_id
  on order_items(variant_id);


-- =========================================================
-- END OF INITIAL MIGRATION
-- =========================================================