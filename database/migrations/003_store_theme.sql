-- =========================================================
-- Dلالتي — Store Theme
-- Manual Supabase migration
-- =========================================================

create table if not exists store_themes (
  id uuid primary key default gen_random_uuid(),

  store_id uuid not null unique
    references stores(id)
    on delete cascade,

  primary_color text not null default '#7A5C3E',
  secondary_color text not null default '#5E4530',
  accent_color text not null default '#B8862E',
  background_color text not null default '#FAF7F2',
  text_color text not null default '#2B2420',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint store_themes_primary_color_hex
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint store_themes_secondary_color_hex
    check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint store_themes_accent_color_hex
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint store_themes_background_color_hex
    check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint store_themes_text_color_hex
    check (text_color ~ '^#[0-9A-Fa-f]{6}$')
);

create index if not exists idx_store_themes_store_id
  on store_themes(store_id);

-- Create a default theme for every existing store.
insert into store_themes (
  store_id,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color
)
select
  id,
  '#7A5C3E',
  '#5E4530',
  '#B8862E',
  '#FAF7F2',
  '#2B2420'
from stores
on conflict (store_id) do nothing;

-- Keep updated_at current when a theme is changed.
create or replace function set_store_themes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_store_themes_updated_at on store_themes;

create trigger trg_store_themes_updated_at
before update on store_themes
for each row
execute function set_store_themes_updated_at();
