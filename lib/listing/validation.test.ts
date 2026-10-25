import assert from "node:assert/strict";
import { test } from "node:test";
import { exampleForm, marketplaces } from "./config";
import { effectiveListing, marketplaceIssues, evaluateListings, validatePricing } from "./validation";

test("marketplace readiness is independent and never claims external publishing", () => {
  const form = exampleForm();
  const results = evaluateListings(form, 1);
  assert.deepEqual(results.map(({ id, status }) => ({ id, status })), [
    { id: "ebay", status: "Ready" },
    { id: "depop", status: "Ready" },
    { id: "vinted", status: "Draft" },
  ]);
  assert.deepEqual(results[2].issues, ["Parcel size is required"]);
  form.marketplaces.vinted.specifics.parcelSize = "Medium";
  assert.equal(evaluateListings(form, 1)[2].status, "Ready");
});

test("overrides affect only one marketplace and restore resumes inheritance", () => {
  const form = exampleForm();
  const original = form.master.title;
  form.marketplaces.ebay.overrides = { title: "Custom eBay title", price: "99.00" };
  assert.equal(effectiveListing(form, marketplaces[0]).title, "Custom eBay title");
  assert.equal(effectiveListing(form, marketplaces[1]).title, original);
  assert.equal(form.master.title, original);
  form.master.title = "Updated master title";
  assert.equal(effectiveListing(form, marketplaces[0]).title, "Custom eBay title");
  delete form.marketplaces.ebay.overrides.title;
  assert.equal(effectiveListing(form, marketplaces[0]).title, "Updated master title");
});

test("an explicit empty override is invalid rather than silently inherited", () => {
  const form = exampleForm();
  form.marketplaces.ebay.overrides.title = " ";
  assert.ok(marketplaceIssues(form, marketplaces[0], 1).includes("Listing title is required"));
  assert.deepEqual(marketplaceIssues(form, marketplaces[1], 1), []);
});

test("photos are required and deselected marketplaces are excluded from results", () => {
  const form = exampleForm();
  assert.ok(evaluateListings(form, 0).every(result => result.status === "Draft"));
  form.marketplaces.depop.selected = false;
  assert.ok(!evaluateListings(form, 1).some(result => result.id === "depop"));
});

test("prices and quantities reject invalid values while optional costs may be empty", () => {
  const form = exampleForm();
  assert.deepEqual(validatePricing(form.master), {});
  for (const value of ["0", "-5", "NaN", "1.001"]) {
    assert.ok(validatePricing({ ...form.master, price: value }).price);
  }
  for (const value of ["0", "-1", "1.5", "Infinity"]) {
    assert.ok(validatePricing({ ...form.master, quantity: value }).quantity);
  }
});
