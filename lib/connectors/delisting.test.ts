import assert from "node:assert/strict";
import { test } from "node:test";
import { requestDelisting, type DelistingOutcome } from "./delisting";
import { connectorMetadata } from "./config";

test("missing connectors never fabricate delisting success",async()=>{
  const results=await requestDelisting([{listingId:"a",marketplace:"ebay",externalId:"existing"}],()=>undefined,async()=>{});
  assert.equal(results[0].status,"required");
  assert(Object.values(connectorMetadata).every(meta=>meta.implemented.length===0));
});
test("one delist failure does not erase another destination's confirmed outcome",async()=>{
  const persisted:DelistingOutcome[]=[];
  const results=await requestDelisting([
    {listingId:"etsy",marketplace:"etsy",externalId:"etsy-external"},
    {listingId:"depop",marketplace:"depop",externalId:"depop-external"},
    {listingId:"vinted",marketplace:"vinted",externalId:null},
  ],marketplace=>({context:{ownerId:"owner",connectionId:"fake-test-connection"},connector:{marketplace,delistListing:async()=>{if(marketplace==="depop")throw new Error("test failure");return {confirmed:true};}}}),async result=>{persisted.push(result);});
  assert.deepEqual(results.map(result=>result.status),["succeeded","error","required"]);
  assert.deepEqual(results,persisted);
});
test("an unconfirmed response never becomes success and persistence errors surface",async()=>{
  await assert.rejects(requestDelisting([{listingId:"a",marketplace:"ebay",externalId:"id"}],()=>({context:{ownerId:"owner",connectionId:"test"},connector:{marketplace:"ebay",delistListing:async()=>({confirmed:false})}}),async result=>{assert.equal(result.status,"error");throw new Error("DB write failed");}),/DB write failed/);
});
test("a connector lookup exception is isolated from later destinations",async()=>{
  const results=await requestDelisting([{listingId:"a",marketplace:"ebay",externalId:"id"},{listingId:"b",marketplace:"etsy",externalId:"id"}],marketplace=>{
    if(marketplace==="ebay") throw new Error("bad configuration");
    return {context:{ownerId:"owner",connectionId:"test"},connector:{marketplace,delistListing:async()=>({confirmed:true})}};
  },async()=>{});
  assert.deepEqual(results.map(result=>result.status),["error","succeeded"]);
});
