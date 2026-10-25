import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyForm, exampleForm } from "./config";
import { listingPayload, masterPayload, parseSubmission, validatePhoto } from "./submission";

test("drafts require a title but may omit publish-time fields", () => {
  const form = emptyForm();
  assert.throws(() => parseSubmission(form, false, 0), /title/);
  form.master.title = " Jacket ";
  const parsed = parseSubmission(form, false, 0);
  assert.equal(parsed.master.title, "Jacket");
  assert.equal((masterPayload(parsed.master) as Record<string, unknown>).default_price, null);
  assert.throws(() => parseSubmission(form, true, 0), /required/);
});

test("independent internal readiness, overrides, and Facebook mapping are persisted", () => {
  const form = exampleForm();
  form.marketplaces.ebay.overrides = { title: "eBay title", price: "99.00" };
  form.marketplaces.facebook.selected = true;
  const parsed = parseSubmission(form, true, 1);
  const listings = listingPayload(parsed, 1) as Record<string, unknown>[];
  assert.deepEqual(listings.map(row => [row.marketplace, row.status]), [["ebay", "ready"], ["depop", "ready"], ["vinted", "draft"], ["facebook_marketplace", "draft"]]);
  assert.equal(listings[0].price_override, 99);
  assert.equal(listings[0].title_override, "eBay title");
  assert.deepEqual(listings[2].missing_fields, ["parcelSize"]);
  assert.equal(parsed.master.price, "85.00");
  assert(!listings.some(row => row.status === "live" || "external_listing_id" in row));
});

test("malformed values are rejected server-side rather than silently coerced", () => {
  const form = exampleForm();
  for (const quantity of ["0", "1.5", "2147483648", "NaN"]) assert.throws(() => parseSubmission({ ...form, master: { ...form.master, quantity } }, false, 0));
  for (const price of ["-1", "Infinity", "99999999999", "1.001"]) assert.throws(() => parseSubmission({ ...form, master: { ...form.master, price } }, false, 0));
  form.marketplaces.ebay.overrides.price = "";
  assert.throws(() => parseSubmission(form, false, 1), /override price/);
  assert.throws(() => parseSubmission({ master: {} }, false, 0));
});

test("images are bounded and file contents must match the accepted MIME type", async () => {
  await validatePhoto(new File([Uint8Array.from([137,80,78,71,13,10,26,10])], "photo.png", { type: "image/png" }));
  await assert.rejects(validatePhoto(new File(["not an image"], "fake.png", { type: "image/png" })), /contents/);
  await assert.rejects(validatePhoto(new File(["svg"], "vector.svg", { type: "image/svg+xml" })), /JPEG/);
  await assert.rejects(validatePhoto(new File([new Uint8Array(10485761)], "large.png", { type: "image/png" })), /10 MB/);
});
