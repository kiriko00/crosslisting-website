-- Transactional multi-table creation. Invoker rights retain all existing RLS.
-- Storage APIs are separate from PostgreSQL transactions; the server compensates
-- failed uploads/commits and reconciles ambiguous responses before cleanup.
begin;

create function public.create_inventory_item(
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
  return jsonb_build_object('id', p_id, 'created', true);
end;
$$;

revoke all on function public.create_inventory_item(uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_inventory_item(uuid, jsonb, jsonb, jsonb)
  to authenticated;

commit;
