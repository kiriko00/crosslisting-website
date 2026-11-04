-- Review/apply manually. All functions are invoker-rights and retain RLS.
begin;

alter table public.inventory_items
  add column revision bigint not null default 0,
  add column last_mutation_id uuid,
  add column deletion_pending boolean not null default false,
  add column selected_marketplaces text[] not null default '{}'::text[]
    check (selected_marketplaces <@ array['ebay','etsy','depop','vinted','poshmark','grailed','facebook_marketplace']::text[]
      and array_position(selected_marketplaces, null) is null);
alter table public.marketplace_listings
  add column delisting_status text not null default 'none'
    check (delisting_status in ('none','required','pending','succeeded','error')),
  add column delisting_error text;

update public.inventory_items as item set selected_marketplaces = array(
  select listing.marketplace from public.marketplace_listings as listing
  where listing.item_id = item.id order by listing.marketplace
);

create function public.advance_inventory_revision() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;
create trigger inventory_revision before update on public.inventory_items
  for each row execute function public.advance_inventory_revision();
revoke all on function public.advance_inventory_revision() from public, anon, authenticated;

-- Durable cleanup survives photo-metadata replacement and permanent item deletion.
-- No FK to the item: these are owned file cleanup tasks, not inventory children.
create table public.photo_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (user_id, storage_path),
  check (split_part(storage_path,'/',1) = user_id::text
    and split_part(storage_path,'/',2) = item_id::text
    and split_part(storage_path,'/',3) <> '')
);
alter table public.photo_cleanup_jobs enable row level security;
create policy photo_cleanup_select on public.photo_cleanup_jobs for select to authenticated using (user_id = (select auth.uid()));
create policy photo_cleanup_insert on public.photo_cleanup_jobs for insert to authenticated with check (user_id = (select auth.uid()));
create policy photo_cleanup_update on public.photo_cleanup_jobs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy photo_cleanup_delete on public.photo_cleanup_jobs for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.photo_cleanup_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.photo_cleanup_jobs to authenticated;
create index photo_cleanup_owner_item_idx on public.photo_cleanup_jobs(user_id, item_id);

create function public.update_inventory_item(
  p_id uuid, p_revision bigint, p_mutation uuid, p_master jsonb, p_listings jsonb, p_photos jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  item public.inventory_items;
  listing jsonb;
  photo jsonb;
begin
  select * into item from public.inventory_items where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Item unavailable' using errcode = '42501'; end if;
  if item.deletion_pending then raise exception 'Deletion is pending; retry deletion instead' using errcode = '40001'; end if;
  if p_mutation is null then raise exception 'Missing mutation ID' using errcode = '22023'; end if;
  if item.last_mutation_id = p_mutation then return jsonb_build_object('id',p_id); end if;
  if item.revision is distinct from p_revision then raise exception 'Item changed. Reload before saving.' using errcode = '40001'; end if;
  if p_master is null or jsonb_typeof(p_master) <> 'object' or p_listings is null or jsonb_typeof(p_listings) <> 'array'
    or p_photos is null or jsonb_typeof(p_photos) <> 'array' then raise exception 'Invalid payload' using errcode = '22023'; end if;
  if jsonb_array_length(p_listings) > 7 or jsonb_array_length(p_photos) > 12 then raise exception 'Too many records' using errcode = '22023'; end if;

  -- Do not silently discard external identity, sale history, or delisting work.
  if exists (select 1 from public.marketplace_listings old where old.item_id = p_id
    and (old.status in ('live','publishing','sold') or old.external_listing_id is not null or old.delisting_status <> 'none')
    and not exists (select 1 from jsonb_array_elements(p_listings) incoming where incoming->>'marketplace' = old.marketplace)) then
    raise exception 'A listing with sale/external/delisting history cannot be removed. Keep that destination selected.' using errcode = '40001';
  end if;

  update public.inventory_items set
    title = p_master->>'title', description = p_master->>'description', category = p_master->>'category',
    subcategory = p_master->>'subcategory', brand = p_master->>'brand', department = p_master->>'department',
    size = p_master->>'size', color = p_master->>'color', material = p_master->>'material', condition = p_master->>'condition',
    condition_notes = p_master->>'condition_notes', sku = p_master->>'sku', measurements = p_master->>'measurements',
    pattern = p_master->>'pattern', style = p_master->>'style', era = p_master->>'era', country_of_manufacture = p_master->>'country_of_manufacture',
    default_price = (p_master->>'default_price')::numeric, original_retail_price = (p_master->>'original_retail_price')::numeric,
    purchase_cost = (p_master->>'purchase_cost')::numeric, quantity = (p_master->>'quantity')::integer,
    item_weight = (p_master->>'item_weight')::numeric, shipping_notes = p_master->>'shipping_notes',
    selected_marketplaces = array(select value->>'marketplace' from jsonb_array_elements(p_listings)), last_mutation_id = p_mutation
  where id = p_id;

  delete from public.marketplace_listings old where old.item_id = p_id
    and not exists (select 1 from jsonb_array_elements(p_listings) incoming where incoming->>'marketplace' = old.marketplace);
  for listing in select value from jsonb_array_elements(p_listings) loop
    if coalesce(listing->>'status','') not in ('draft','ready') then raise exception 'Only internal readiness may be set' using errcode = '22023'; end if;
    insert into public.marketplace_listings as existing (item_id, marketplace, status, title_override, description_override, price_override, missing_fields, marketplace_specifics)
    values (p_id, listing->>'marketplace', listing->>'status', listing->>'title_override', listing->>'description_override',
      (listing->>'price_override')::numeric, array(select jsonb_array_elements_text(listing->'missing_fields')), listing->'marketplace_specifics')
    on conflict (item_id,marketplace) do update set
      title_override = excluded.title_override, description_override = excluded.description_override,
      price_override = excluded.price_override, missing_fields = excluded.missing_fields, marketplace_specifics = excluded.marketplace_specifics,
      status = case when existing.status in ('draft','ready') and existing.external_listing_id is null
        then excluded.status else existing.status end;
  end loop;

  for photo in select value from jsonb_array_elements(p_photos) loop
    if photo->>'storage_path' is null or split_part(photo->>'storage_path','/',1) <> auth.uid()::text
      or split_part(photo->>'storage_path','/',2) <> p_id::text or split_part(photo->>'storage_path','/',3) = '' then
      raise exception 'Invalid owned photo path' using errcode = '42501';
    end if;
  end loop;
  insert into public.photo_cleanup_jobs (user_id,item_id,storage_path)
    select auth.uid(), p_id, old.storage_path from public.item_photos old where old.item_id = p_id
    and not exists (select 1 from jsonb_array_elements(p_photos) incoming where incoming->>'storage_path' = old.storage_path)
    on conflict (user_id,storage_path) do nothing;
  delete from public.item_photos where item_id = p_id;
  insert into public.item_photos (item_id,storage_path,sort_order)
    select p_id,value->>'storage_path',(value->>'sort_order')::integer from jsonb_array_elements(p_photos);
  return jsonb_build_object('id',p_id);
end;
$$;

create function public.record_inventory_sale(p_id uuid, p_sale_id uuid, p_revision bigint, p_sale jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  item public.inventory_items;
  listing_id uuid := (p_sale->>'marketplace_listing_id')::uuid;
  channel text;
  sold_time timestamptz := (p_sale->>'sold_at')::timestamptz;
begin
  select * into item from public.inventory_items where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Item unavailable' using errcode = '42501'; end if;
  if exists (select 1 from public.sales where id = p_sale_id and item_id = p_id) then return jsonb_build_object('id',p_sale_id); end if;
  if item.deletion_pending or item.revision is distinct from p_revision or item.status = 'sold' or exists (select 1 from public.sales where item_id = p_id) then
    raise exception 'Item changed, is being deleted, or already has a sale. Reload first.' using errcode = '40001';
  end if;
  if sold_time is null or sold_time < '1900-01-01'::timestamptz or sold_time > now() + interval '5 minutes' then raise exception 'Invalid sold date' using errcode = '22023'; end if;
  if listing_id is not null then
    select marketplace into channel from public.marketplace_listings where id = listing_id and item_id = p_id;
    if not found then raise exception 'Sale listing does not belong to item' using errcode = '42501'; end if;
  else channel := btrim(p_sale->>'sale_channel'); end if;
  if channel is null or length(channel) = 0 or length(channel) > 120 then raise exception 'Invalid sale channel' using errcode = '22023'; end if;
  insert into public.sales (id,item_id,marketplace_listing_id,sale_channel,sale_price,marketplace_fees,shipping_cost,sold_at)
    values (p_sale_id,p_id,listing_id,channel,(p_sale->>'sale_price')::numeric,(p_sale->>'marketplace_fees')::numeric,(p_sale->>'shipping_cost')::numeric,sold_time);
  update public.inventory_items set status = 'sold', sold_at = sold_time where id = p_id;
  update public.marketplace_listings set status = 'sold', sold_at = sold_time, delisting_status = 'none', delisting_error = null
    where id = listing_id and item_id = p_id;
  update public.marketplace_listings set delisting_status = 'required', delisting_error = 'Not attempted: official connector not implemented.'
    where item_id = p_id and id is distinct from listing_id and status in ('live','ready','publishing');
  return jsonb_build_object('id',p_sale_id);
end;
$$;

create function public.inventory_lifecycle(p_id uuid, p_revision bigint, p_action text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare item public.inventory_items;
begin
  select * into item from public.inventory_items where id = p_id and user_id = auth.uid() for update;
  if not found then
    if p_action = 'delete_finish' then return jsonb_build_object('id',p_id); end if;
    raise exception 'Item unavailable' using errcode = '42501';
  end if;
  if p_action = 'delete_finish' then
    if not item.deletion_pending then raise exception 'Confirm deletion first' using errcode = '40001'; end if;
    -- Read Storage metadata only. Binary deletion is exclusively via Storage API.
    if exists (select 1 from storage.objects where bucket_id = 'item-photos' and name like auth.uid()::text || '/' || p_id::text || '/%') then
      raise exception 'Photo files remain. Retry cleanup before deleting the record.' using errcode = '40001';
    end if;
    delete from public.photo_cleanup_jobs where item_id = p_id and user_id = auth.uid();
    delete from public.inventory_items where id = p_id;
  elsif p_action = 'delete_begin' and item.deletion_pending then
    return jsonb_build_object('id',p_id);
  elsif p_action = 'archive' and item.status = 'archived' and not item.deletion_pending then
    return jsonb_build_object('id',p_id);
  else
    if item.revision is distinct from p_revision or item.deletion_pending then raise exception 'Item changed. Reload first.' using errcode = '40001'; end if;
    if p_action = 'archive' then
      update public.inventory_items set status = 'archived' where id = p_id;
      update public.marketplace_listings set delisting_status = 'required', delisting_error = 'Archived internally; external delisting not attempted.'
        where item_id = p_id and status in ('live','publishing','ready');
    elsif p_action = 'delete_begin' then
      if exists (select 1 from public.marketplace_listings where item_id = p_id and
        (status in ('live','publishing') or (external_listing_id is not null and delisting_status in ('required','pending','error')))) then
        raise exception 'Resolve external listings before permanent deletion. Archive instead.' using errcode = '40001';
      end if;
      update public.inventory_items set deletion_pending = true where id = p_id;
    else raise exception 'Invalid lifecycle action' using errcode = '22023'; end if;
  end if;
  return jsonb_build_object('id',p_id);
end;
$$;

revoke all on function public.update_inventory_item(uuid,bigint,uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.record_inventory_sale(uuid,uuid,bigint,jsonb) from public,anon,authenticated;
revoke all on function public.inventory_lifecycle(uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.update_inventory_item(uuid,bigint,uuid,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.record_inventory_sale(uuid,uuid,bigint,jsonb) to authenticated;
grant execute on function public.inventory_lifecycle(uuid,bigint,text) to authenticated;

-- Updated create function follows, so new items retain explicit selections too.
create or replace function public.create_inventory_item(
  p_id uuid, p_master jsonb, p_listings jsonb, p_photos jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  listing jsonb;
  photo jsonb;
begin
  if owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_id is null or p_master is null or jsonb_typeof(p_master) <> 'object'
    or p_listings is null or jsonb_typeof(p_listings) <> 'array'
    or p_photos is null or jsonb_typeof(p_photos) <> 'array' then
    raise exception 'Invalid item payload' using errcode = '22023';
  end if;
  if jsonb_array_length(p_listings) > 7 or jsonb_array_length(p_photos) > 12 then
    raise exception 'Too many listings or photos' using errcode = '22023';
  end if;

  -- Serialize identical submissions even when two requests arrive together.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text, 0));
  if exists (select 1 from public.inventory_items where id = p_id and user_id = owner_id) then
    return jsonb_build_object('id', p_id, 'created', false);
  end if;

  insert into public.inventory_items (
    id, user_id, status, title, description, category, subcategory, brand,
    department, size, color, material, condition, condition_notes, sku,
    measurements, pattern, style, era, country_of_manufacture, default_price,
    original_retail_price, purchase_cost, quantity, item_weight, shipping_notes
  ) values (
    p_id, owner_id, 'draft', p_master->>'title', p_master->>'description',
    p_master->>'category', p_master->>'subcategory', p_master->>'brand',
    p_master->>'department', p_master->>'size', p_master->>'color',
    p_master->>'material', p_master->>'condition', p_master->>'condition_notes',
    p_master->>'sku', p_master->>'measurements', p_master->>'pattern',
    p_master->>'style', p_master->>'era', p_master->>'country_of_manufacture',
    (p_master->>'default_price')::numeric, (p_master->>'original_retail_price')::numeric,
    (p_master->>'purchase_cost')::numeric, coalesce((p_master->>'quantity')::integer, 1),
    (p_master->>'item_weight')::numeric, p_master->>'shipping_notes'
  );

  for listing in select value from jsonb_array_elements(p_listings) loop
    -- No caller of this RPC can create a supposedly live external listing.
    if coalesce(listing->>'status', '') not in ('draft', 'ready') then
      raise exception 'Only internal draft/ready listings can be saved' using errcode = '22023';
    end if;
    insert into public.marketplace_listings (
      item_id, marketplace, status, title_override, description_override,
      price_override, missing_fields, marketplace_specifics
    ) values (
      p_id, listing->>'marketplace', listing->>'status', listing->>'title_override',
      listing->>'description_override', (listing->>'price_override')::numeric,
      array(select jsonb_array_elements_text(listing->'missing_fields')),
      coalesce(listing->'marketplace_specifics', '{}'::jsonb)
    );
  end loop;

  for photo in select value from jsonb_array_elements(p_photos) loop
    if photo->>'storage_path' is null or
      split_part(photo->>'storage_path', '/', 1) <> owner_id::text or
      split_part(photo->>'storage_path', '/', 2) <> p_id::text or
      split_part(photo->>'storage_path', '/', 3) = '' then
      raise exception 'Photo path must belong to this user and item' using errcode = '42501';
    end if;
    insert into public.item_photos (item_id, storage_path, sort_order)
      values (p_id, photo->>'storage_path', (photo->>'sort_order')::integer);
  end loop;
  update public.inventory_items set selected_marketplaces = array(select value->>'marketplace' from jsonb_array_elements(p_listings)) where id = p_id;
  return jsonb_build_object('id', p_id, 'created', true);
end;
$$;

revoke all on function public.create_inventory_item(uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_inventory_item(uuid, jsonb, jsonb, jsonb)
  to authenticated;


commit;
