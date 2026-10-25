-- Apply explicitly after review. Existing application-table RLS is unchanged.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Ownership is the first directory: USER_UUID/ITEM_UUID/random-name.ext.
-- UPDATE checks old and new names to prevent moving into another user's folder.
create policy item_photos_storage_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy item_photos_storage_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy item_photos_storage_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy item_photos_storage_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Supabase manages storage.objects permissions/RLS. Do not replace existing
-- policies, disable RLS, or grant anonymous access to enable this bucket.
commit;
