import assert from "node:assert/strict";
import { test } from "node:test";
import { reorderPhotos } from "./photo-order";

const photos = ["front", "back", "label"].map(id => ({ id, name: `${id}.png`, url: `blob:${id}` }));

test("dragging to first position changes the preview and preserves photo URLs", () => {
  const ordered = reorderPhotos(photos, "label", "front");
  assert.deepEqual(ordered.map(photo => photo.id), ["label", "front", "back"]);
  assert.equal(ordered[0].url, "blob:label");
  assert.deepEqual(photos.map(photo => photo.id), ["front", "back", "label"]);
  assert.equal(ordered.filter(photo => photo.id !== "label")[0].id, "front");
});

test("moving later commits the complete new order", () => {
  assert.deepEqual(reorderPhotos(photos, "front", "label").map(photo => photo.id), ["back", "label", "front"]);
});

test("cancelled or invalid moves do not change order", () => {
  assert.equal(reorderPhotos(photos, "front", "front"), photos);
  assert.equal(reorderPhotos(photos, "unknown", "back"), photos);
});
