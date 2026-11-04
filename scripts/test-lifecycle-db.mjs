// Optional, isolated PostgreSQL test. Pass an installed PGlite module path.
// It bootstraps a LOCAL Supabase-like auth/storage schema, not any remote project.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const modulePath=process.argv[2];
if(!modulePath) throw new Error("Pass the absolute path to an isolated @electric-sql/pglite/dist/index.js installation.");
const {PGlite}=await import(pathToFileURL(modulePath).href);
const db=new PGlite();
const root=fileURLToPath(new URL("../",import.meta.url));
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
const item="33333333-3333-4333-8333-333333333333";
const mutation="44444444-4444-4444-8444-444444444444";
const sale="55555555-5555-4555-8555-555555555555";
const path1=`${a}/${item}/front.jpg`,path2=`${a}/${item}/back.jpg`;
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema auth,storage,public to authenticated,anon;
    grant select,insert,update,delete on storage.objects to authenticated;
    insert into auth.users values ('${a}'),('${b}');
  `);
  for(const file of ["20261022001313_initial_crosslisting_schema.sql","20261023223100_private_item_photos.sql","20261023223200_atomic_inventory_save.sql","20261026195800_inventory_lifecycle.sql"]) {
    await db.exec(await readFile(resolve(root,"supabase/migrations",file),"utf8"));
  }
  console.log("All four migrations applied to isolated PostgreSQL.");
  async function user(id) { await db.exec("set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); }
  async function row(id=item) { return (await db.query("select * from public.inventory_items where id=$1",[id])).rows[0]; }
  const master={title:"Vintage jacket",description:"Denim",category:"clothing",condition:"good",quantity:1,default_price:85};
  const listings=[{marketplace:"ebay",status:"ready",title_override:"eBay jacket",price_override:95,missing_fields:[],marketplace_specifics:{}},{marketplace:"etsy",status:"ready",missing_fields:[],marketplace_specifics:{}}];
  await user(a);
  await db.query("insert into storage.objects(bucket_id,name) values ('item-photos',$1),('item-photos',$2)",[path1,path2]);
  await db.query("select public.create_inventory_item($1,$2,$3,$4)",[item,master,listings,[{storage_path:path1,sort_order:0},{storage_path:path2,sort_order:1}]]);
  let current=await row();
  assert.equal(current.selected_marketplaces.length,2);
  const originalRevision=current.revision;
  const editArgs=[item,current.revision,mutation,{...master,title:"Edited jacket"},listings,[{storage_path:path2,sort_order:0}]];
  await db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",editArgs);
  current=await row(); assert.equal(current.title,"Edited jacket"); assert(current.revision>originalRevision);
  assert.equal((await db.query("select * from public.item_photos where item_id=$1",[item])).rows[0].storage_path,path2);
  assert.equal((await db.query("select * from public.photo_cleanup_jobs")).rows.length,1);
  await db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",editArgs);
  assert.equal((await row()).revision,current.revision,"edit retry must be idempotent");
  await assert.rejects(db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",[item,originalRevision,"66666666-6666-4666-8666-666666666666",master,listings,[]]),/changed/);
  await assert.rejects(db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",[item,null,"66666666-6666-4666-8666-666666666666",master,listings,[]]),/changed/);
  await user(b);
  assert.equal((await db.query("select * from public.inventory_items")).rows.length,0);
  assert.equal((await db.query("select * from public.photo_cleanup_jobs")).rows.length,0);
  assert.equal((await db.query("select * from storage.objects")).rows.length,0);
  await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('item-photos',$1)",[path1]),/row-level security/);
  await assert.rejects(db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",editArgs),/unavailable/);
  await assert.rejects(db.query("select public.inventory_lifecycle($1,$2,'archive')",[item,current.revision]),/unavailable/);
  await user(a);
  const ebay=(await db.query("select id from public.marketplace_listings where item_id=$1 and marketplace='ebay'",[item])).rows[0].id;
  const saleData={marketplace_listing_id:ebay,sale_channel:"ignored-browser-value",sale_price:100,marketplace_fees:10,shipping_cost:5,sold_at:"2026-01-01T00:00:00Z"};
  await db.query("select public.record_inventory_sale($1,$2,$3,$4)",[item,sale,current.revision,saleData]);
  await db.query("select public.record_inventory_sale($1,$2,$3,$4)",[item,sale,current.revision,saleData]);
  assert.equal((await db.query("select * from public.sales")).rows.length,1);
  assert.equal((await db.query("select sale_channel from public.sales")).rows[0].sale_channel,"ebay");
  assert.equal((await row()).status,"sold");
  const states=(await db.query("select marketplace,status,delisting_status from public.marketplace_listings order by marketplace")).rows;
  assert.deepEqual(states,[{marketplace:"ebay",status:"sold",delisting_status:"none"},{marketplace:"etsy",status:"ready",delisting_status:"required"}]);
  await user(b);
  assert.equal((await db.query("select * from public.sales")).rows.length,0,"another user cannot read recorded sales");
  assert.equal((await db.query("select * from public.marketplace_listings")).rows.length,0);
  await assert.rejects(db.query("select public.record_inventory_sale($1,$2,$3,$4)",[item,sale,current.revision,saleData]),/unavailable/);
  await user(a);
  await assert.rejects(db.query("select public.record_inventory_sale($1,$2,$3,$4)",[item,"77777777-7777-4777-8777-777777777777",(await row()).revision,saleData]),/already has a sale/);
  await db.query("select public.inventory_lifecycle($1,$2,'archive')",[item,(await row()).revision]);
  assert.equal((await row()).status,"archived"); assert.equal((await db.query("select * from public.sales")).rows.length,1);
  await db.query("select public.inventory_lifecycle($1,$2,'delete_begin')",[item,(await row()).revision]);
  assert.equal((await row()).deletion_pending,true);
  await assert.rejects(db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",editArgs),/Deletion is pending/);
  await assert.rejects(db.query("select public.inventory_lifecycle($1,$2,'delete_finish')",[item,0]),/Photo files remain/);
  assert(await row(),"failed cleanup must retain item");
  // LOCAL provider stub only: simulate the Storage API removing its metadata.
  // Application code never writes storage.objects directly.
  await db.query("delete from storage.objects where bucket_id='item-photos' and name in ($1,$2)",[path1,path2]);
  await db.query("select public.inventory_lifecycle($1,$2,'delete_finish')",[item,0]);
  assert.equal(await row(),undefined); assert.equal((await db.query("select * from public.sales")).rows.length,0);
  assert.equal((await db.query("select * from public.photo_cleanup_jobs")).rows.length,0);
  const liveItem="88888888-8888-4888-8888-888888888888";
  await db.query("select public.create_inventory_item($1,$2,$3,$4)",[liveItem,master,listings,[]]);
  await db.query("update public.marketplace_listings set status='live',external_listing_id='local-test-only' where item_id=$1 and marketplace='ebay'",[liveItem]);
  const liveRevision=(await row(liveItem)).revision;
  await assert.rejects(db.query("select public.inventory_lifecycle($1,$2,'delete_begin')",[liveItem,liveRevision]),/Resolve external listings/);
  await db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",[liveItem,liveRevision,mutation,master,listings,[]]);
  assert.equal((await db.query("select status from public.marketplace_listings where item_id=$1 and marketplace='ebay'",[liveItem])).rows[0].status,"live","editing must not downgrade live to ready");
  await assert.rejects(db.query("select public.update_inventory_item($1,$2,$3,$4,$5,$6)",[liveItem,(await row(liveItem)).revision,"99999999-9999-4999-8999-999999999999",master,[listings[1]],[]]),/cannot be removed/);
  await user(b);
  await assert.rejects(db.query("insert into public.sales(item_id,marketplace_listing_id,sale_channel,sale_price) values ($1,$2,'manual',10)",[liveItem,ebay]),/row-level security|foreign key/);
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.query("select * from public.inventory_items"),/permission denied/);
  console.log("Lifecycle DB assertions passed: edit/retry/conflict, ownership/RLS, sale/idempotency, delisting flags, archive, deletion fence/Storage guard, and cascades.");
} finally { await db.close(); }
