import assert from "node:assert/strict";
import { test } from "node:test";
import { deleteInventoryItem, type DeletionGateway } from "./delete";
import { persistEdit, type EditGateway } from "./edit";
import { netProceeds,parseSale } from "./sale";
import { hydrateListing } from "../listing/hydrate";
import { missingDestinations } from "./missing";
import type { InventoryItem,MarketplaceListing } from "../supabase/database.types";

test("delete fences before file cleanup and never finalizes after cleanup failure",async()=>{
  const calls:string[]=[];
  const gateway:DeletionGateway={begin:async()=>{calls.push("begin");},list:async()=>[{id:"photo",name:"photo.jpg"}],remove:async()=>{calls.push("remove");throw new Error("Storage offline");},finish:async()=>{calls.push("finish");}};
  await assert.rejects(deleteInventoryItem(gateway),/offline/);
  assert.deepEqual(calls,["begin","remove"]);
  let lists=0;
  gateway.list=async()=>lists++?[ ]:[{id:"photo",name:"photo.jpg"}];
  gateway.remove=async()=>{calls.push("remove-success");};
  await deleteInventoryItem(gateway);
  assert.equal(calls.at(-1),"finish");
});
test("delete pauses on nested folders or non-progressing Storage responses",async()=>{
  let finished=false;
  const gateway:DeletionGateway={begin:async()=>{},list:async()=>[{id:null,name:"folder"}],remove:async()=>{},finish:async()=>{finished=true;}};
  await assert.rejects(deleteInventoryItem(gateway),/nested folder/);
  gateway.list=async()=>[{id:"photo",name:"same.jpg"}];
  await assert.rejects(deleteInventoryItem(gateway),/could not be confirmed/);
  assert.equal(finished,false);
});
test("edit reconciliation preserves retained photos and cleans only unused uploads",async()=>{
  const removed:string[][]=[];
  const gateway:EditGateway={upload:async()=>{},remove:async paths=>{removed.push(paths);},commit:async()=>{throw new Error("lost response");},find:async()=>({id:"item",mutation:"op",paths:["old.jpg","new.jpg"]})};
  assert.deepEqual(await persistEdit(gateway,[new File(["a"],"a")],["new.jpg"],"op"),{warning:false});
  assert.deepEqual(removed,[]);
  gateway.find=async()=>({id:"item",mutation:"different",paths:["old.jpg"]});
  await assert.rejects(persistEdit(gateway,[new File(["a"],"a")],["new.jpg"],"op"),/not saved/);
  assert.deepEqual(removed,[["new.jpg"]]);
});
test("manual sales validate money/dates and compute net in integer cents",()=>{
  const input={saleId:"11111111-1111-4111-8111-111111111111",marketplace_listing_id:null,sale_channel:"Local",sale_price:"0.00",marketplace_fees:"",shipping_cost:"",sold_date:"2026-01-01"};
  assert.doesNotThrow(()=>parseSale(input));
  for(const patch of [{sale_price:"-1"},{marketplace_fees:"NaN"},{sold_date:"2026-02-31"},{sold_date:"2999-01-01"},{marketplace_listing_id:"not-uuid"}]) assert.throws(()=>parseSale({...input,...patch}));
  assert.equal(netProceeds(1.01,0.1,0.2),0.71);
  assert.equal(netProceeds(100,null,null),100);
});
test("edit hydration restores master, explicit zero overrides, and missing selected rows",()=>{
  const item:InventoryItem={id:"item",user_id:"owner",title:"Jacket",description:"Denim",category:"clothing",condition:"good",quantity:1,selected_marketplaces:["ebay","etsy"],default_price:85,original_retail_price:null,purchase_cost:null,item_weight:null,status:"draft",revision:0,last_mutation_id:null,deletion_pending:false,created_at:"2026-01-01",updated_at:"2026-01-01",sold_at:null,subcategory:null,brand:null,department:null,size:null,color:null,material:null,condition_notes:null,sku:null,measurements:null,pattern:null,style:null,era:null,country_of_manufacture:null,shipping_notes:null};
  const listing:MarketplaceListing={id:"listing",item_id:"item",marketplace:"ebay",title_override:"Custom",description_override:null,price_override:0,marketplace_specifics:{parcelSize:"Small"},status:"draft",missing_fields:["price"],external_listing_id:null,error_message:null,delisting_status:"none",delisting_error:null,created_at:"2026-01-01",updated_at:"2026-01-01",published_at:null,sold_at:null};
  const form=hydrateListing(item,[listing]);
  assert.equal(form.master.price,"85");assert.equal(form.master.condition,"Good");
  assert.equal(form.marketplaces.ebay.overrides.price,"0");
  assert.equal(form.marketplaces.etsy.selected,true);
  assert.equal(form.marketplaces.ebay.specifics.parcelSize,"Small");
  assert.deepEqual(missingDestinations({...item,marketplace_listings:[listing]}).map(row=>[row.marketplace,!!row.listing]),[["ebay",true],["etsy",false]]);
});
