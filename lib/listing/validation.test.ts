import assert from "node:assert/strict";
import { test } from "node:test";
import { exampleForm, marketplaces } from "./config";
import { effectiveListing, marketplaceIssues, simulatePublish, validatePricing } from "./validation";

test("marketplace requirements remain independent and publishing skips incomplete destinations", () => {
  const form = exampleForm();
  const results = simulatePublish(form, 1);
  assert.deepEqual(results.map(({ id, status }) => ({ id, status })), [
    { id: "ebay", status: "Live" },
    { id: "depop", status: "Live" },
    { id: "vinted", status: "Draft" },
  ]);
  assert.deepEqual(results[2].issues, ["Parcel size is required"]);
  form.marketplaces.vinted.specifics.parcelSize = "Medium";
  assert.equal(simulatePublish(form, 1)[2].status, "Live");
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
  assert.ok(simulatePublish(form, 0).every(result => result.status === "Draft"));
  form.marketplaces.depop.selected = false;
  assert.ok(!simulatePublish(form, 1).some(result => result.id === "depop"));
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
