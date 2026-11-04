import assert from "node:assert/strict";
import { test } from "node:test";
import { persistItem, type PersistenceGateway, type SavedItem } from "./persist";

function fixture() {
  const calls: string[] = [];
  const gateway: PersistenceGateway = {
    async find() { return null; },
    async upload(_file, path) { calls.push(`upload:${path}`); },
    async remove(paths) { calls.push(`remove:${paths.join(",")}`); },
    async commit() { calls.push("commit"); return { id: "item", created: true }; },
  };
  const files = [new File(["front"], "front.png"), new File(["back"], "back.png")];
  return { gateway, calls, files, paths: ["user/item/front.png", "user/item/back.png"] };
}

test("photos are uploaded in order before a single atomic commit", async () => {
  const { gateway, calls, files, paths } = fixture();
  assert.deepEqual(await persistItem(gateway, files, paths), { id: "item" });
  assert.deepEqual(calls, [`upload:${paths[0]}`, `upload:${paths[1]}`, "commit"]);
});
test("a retry of an already saved item does not upload or create another record", async () => {
  const { gateway, calls, files, paths } = fixture();
  gateway.find = async () => ({ id: "item", paths });
  assert.deepEqual(await persistItem(gateway, files, paths), { id: "item" });
  assert.deepEqual(calls, []);
});
test("a failed upload cleans attempted objects and never creates database rows", async () => {
  const { gateway, calls, files, paths } = fixture();
  gateway.upload = async () => { throw new Error("transport"); };
  await assert.rejects(persistItem(gateway, files, paths), /Photo upload failed/);
  assert.deepEqual(calls, [`remove:${paths[0]}`]);
});
test("a rejected database transaction removes uploaded objects", async () => {
  const { gateway, calls, files, paths } = fixture();
  gateway.commit = async () => { throw new Error("db"); };
  await assert.rejects(persistItem(gateway, files, paths), /database save failed/);
  assert.equal(calls.at(-1), `remove:${paths.join(",")}`);
});
test("a lost commit response is reconciled without deleting committed photos", async () => {
  const { gateway, calls, files, paths } = fixture();
  let saved: SavedItem | null = null;
  gateway.find = async () => saved;
  gateway.commit = async uploaded => { saved = { id: "item", paths: uploaded }; throw new Error("lost response"); };
  assert.deepEqual(await persistItem(gateway, files, paths), { id: "item" });
  assert(!calls.some(call => call.startsWith("remove:")));
});
test("an ambiguous save keeps photos when database status cannot be checked", async () => {
  const { gateway, calls, files, paths } = fixture();
  let checks = 0;
  gateway.find = async () => { if (checks++) throw new Error("offline"); return null; };
  gateway.commit = async () => { throw new Error("offline"); };
  await assert.rejects(persistItem(gateway, files, paths), /could not be confirmed/);
  assert(!calls.some(call => call.startsWith("remove:")));
});
test("a concurrent duplicate cleans only the second attempt's unused files", async () => {
  const { gateway, calls, files, paths } = fixture();
  let checks = 0;
  gateway.find = async () => checks++ ? { id: "item", paths: ["user/item/original.png"] } : null;
  gateway.commit = async () => ({ id: "item", created: false });
  assert.deepEqual(await persistItem(gateway, files, paths), { id: "item" });
  assert.equal(calls.at(-1), `remove:${paths.join(",")}`);
});
test("cleanup failures are explicit rather than reported as a wholly successful rollback", async () => {
  const { gateway, files, paths } = fixture();
  gateway.upload = async () => { throw new Error("upload"); };
  gateway.remove = async () => { throw new Error("cleanup"); };
  await assert.rejects(persistItem(gateway, files, paths), /could not be removed/);
});
