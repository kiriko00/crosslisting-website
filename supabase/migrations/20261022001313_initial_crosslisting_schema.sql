-- Initial Crosslisting schema. Prepared for review; do not apply automatically.
-- Targets Supabase PostgreSQL 15+ (column-specific ON DELETE SET NULL).
-- No seed data, Storage buckets, credentials, or marketplace automation.

begin;

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'sold', 'archived')),
  title text not null check (btrim(title) <> ''),
  -- Drafts may be incomplete. Publish-time validation remains marketplace-local.
  description text,
  category text check (category in ('clothing', 'footwear', 'bags', 'jewelry', 'accessories')),
  subcategory text,
  brand text,
  department text,
  size text,
  color text,
  material text,
  condition text check (condition in (
    'new_with_tags', 'new_without_tags', 'excellent', 'good', 'fair'
  )),
  condition_notes text,
  sku text,
  measurements text,
  pattern text,
  style text,
  era text,
  country_of_manufacture text,
  -- Amounts use the current UI's USD convention. Bounds also reject numeric NaN.
  default_price numeric(12, 2)
    check (default_price >= 0 and default_price < 'Infinity'::numeric),
  original_retail_price numeric(12, 2)
    check (original_retail_price >= 0 and original_retail_price < 'Infinity'::numeric),
  purchase_cost numeric(12, 2)
    check (purchase_cost >= 0 and purchase_cost < 'Infinity'::numeric),
  quantity integer not null default 1 check (quantity > 0),
  -- Pounds, matching the current Create Listing weight field.
  item_weight numeric(12, 3)
    check (item_weight > 0 and item_weight < 'Infinity'::numeric),
  shipping_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sold_at timestamptz
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  marketplace text not null check (marketplace in (
    'ebay', 'depop', 'vinted', 'etsy', 'poshmark', 'grailed', 'facebook_marketplace'
  )),
  status text not null default 'draft' check (status in (
    'draft', 'ready', 'publishing', 'live', 'error', 'sold', 'delisted'
  )),
  external_listing_id text,
  -- NULL means inherit the master value; empty text can represent an unfinished
  -- override and is handled by independent marketplace-readiness validation.
  title_override text,
  description_override text,
  price_override numeric(12, 2)
    check (price_override >= 0 and price_override < 'Infinity'::numeric),
  -- Flat field identifiers, for example ARRAY['parcel_size']; no extra table.
  missing_fields text[] not null default '{}'::text[]
    check (array_position(missing_fields, null) is null),
  -- Extensible values such as parcel size; never use for tokens or credentials.
  marketplace_specifics jsonb not null default '{}'::jsonb
    check (jsonb_typeof(marketplace_specifics) = 'object'),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  sold_at timestamptz,
  constraint marketplace_listings_item_marketplace_key unique (item_id, marketplace),
  -- Required by sales' composite FK so a sale cannot name another item's listing.
  constraint marketplace_listings_id_item_key unique (id, item_id)
);

create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  storage_path text not null check (btrim(storage_path) <> ''),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  -- Future reorder transactions can defer this constraint to safely swap orders.
  constraint item_photos_item_sort_order_key unique (item_id, sort_order)
    deferrable initially immediate
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  marketplace_listing_id uuid,
  -- Free text also supports manual/off-platform sales, e.g. 'local_pickup'.
  sale_channel text not null check (btrim(sale_channel) <> ''),
  sale_price numeric(12, 2) not null
    check (sale_price >= 0 and sale_price < 'Infinity'::numeric),
  marketplace_fees numeric(12, 2)
    check (marketplace_fees >= 0 and marketplace_fees < 'Infinity'::numeric),
  shipping_cost numeric(12, 2)
    check (shipping_cost >= 0 and shipping_cost < 'Infinity'::numeric),
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint sales_listing_same_item_fk
    foreign key (marketplace_listing_id, item_id)
    references public.marketplace_listings(id, item_id)
    on delete set null (marketplace_listing_id)
);

-- Leading columns in the unique indexes already cover listing/photo item FKs.
-- Do not duplicate those with separate item_id-only indexes.
create index inventory_items_user_id_idx on public.inventory_items(user_id);
create index sales_item_id_idx on public.sales(item_id);
create index sales_marketplace_listing_id_item_id_idx
  on public.sales(marketplace_listing_id, item_id)
  where marketplace_listing_id is not null;

-- Simple trigger-only helper: invoker rights and an empty search_path.
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create trigger marketplace_listings_set_updated_at
  before update on public.marketplace_listings
  for each row execute function public.set_updated_at();

-- Trigger execution does not require exposing this helper as a Data API RPC.
revoke all on function public.set_updated_at() from public, anon, authenticated;

alter table public.inventory_items enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.item_photos enable row level security;
alter table public.sales enable row level security;

-- Direct ownership. WITH CHECK prevents assigning ownership to another user.
create policy inventory_items_select_own on public.inventory_items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy inventory_items_insert_own on public.inventory_items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy inventory_items_update_own on public.inventory_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy inventory_items_delete_own on public.inventory_items
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Child ownership is derived from the master item, not a duplicated user_id.
-- INSERT/UPDATE checks prevent attaching or moving records to another owner.
create policy marketplace_listings_select_own on public.marketplace_listings
  for select to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = marketplace_listings.item_id
      and item.user_id = (select auth.uid())
  ));

create policy marketplace_listings_insert_own on public.marketplace_listings
  for insert to authenticated
  with check (exists (
    select 1 from public.inventory_items as item
    where item.id = marketplace_listings.item_id
      and item.user_id = (select auth.uid())
  ));

create policy marketplace_listings_update_own on public.marketplace_listings
  for update to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = marketplace_listings.item_id
      and item.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.inventory_items as item
    where item.id = marketplace_listings.item_id
      and item.user_id = (select auth.uid())
  ));

create policy marketplace_listings_delete_own on public.marketplace_listings
  for delete to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = marketplace_listings.item_id
      and item.user_id = (select auth.uid())
  ));

create policy item_photos_select_own on public.item_photos
  for select to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = item_photos.item_id
      and item.user_id = (select auth.uid())
  ));

create policy item_photos_insert_own on public.item_photos
  for insert to authenticated
  with check (exists (
    select 1 from public.inventory_items as item
    where item.id = item_photos.item_id
      and item.user_id = (select auth.uid())
  ));

create policy item_photos_update_own on public.item_photos
  for update to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = item_photos.item_id
      and item.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.inventory_items as item
    where item.id = item_photos.item_id
      and item.user_id = (select auth.uid())
  ));

create policy item_photos_delete_own on public.item_photos
  for delete to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = item_photos.item_id
      and item.user_id = (select auth.uid())
  ));

create policy sales_select_own on public.sales
  for select to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = sales.item_id
      and item.user_id = (select auth.uid())
  ));

create policy sales_insert_own on public.sales
  for insert to authenticated
  with check (exists (
    select 1 from public.inventory_items as item
    where item.id = sales.item_id
      and item.user_id = (select auth.uid())
  ));

create policy sales_update_own on public.sales
  for update to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = sales.item_id
      and item.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.inventory_items as item
    where item.id = sales.item_id
      and item.user_id = (select auth.uid())
  ));

create policy sales_delete_own on public.sales
  for delete to authenticated
  using (exists (
    select 1 from public.inventory_items as item
    where item.id = sales.item_id
      and item.user_id = (select auth.uid())
  ));

-- Explicit opt-in for projects with automatic table exposure disabled.
-- Reset even inherited per-table defaults, then grant only authenticated CRUD.
-- No anonymous/public reads and no TRUNCATE, REFERENCES, or TRIGGER privileges.
revoke all on table
  public.inventory_items,
  public.marketplace_listings,
  public.item_photos,
  public.sales
  from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.inventory_items,
  public.marketplace_listings,
  public.item_photos,
  public.sales
  to authenticated;

commit;
