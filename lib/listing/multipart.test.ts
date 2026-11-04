import assert from "node:assert/strict";
import { test } from "node:test";
import { readMultipart, UploadTooLarge } from "./multipart";

async function request() {
  const body = new FormData();
  body.set("listing", "test");
  body.set("photos", new File([new Uint8Array(2000)], "photo.png", { type: "image/png" }));
  const encoded = new Request("http://localhost/upload", { method: "POST", body });
  const bytes = new Uint8Array(await encoded.arrayBuffer());
  // Model the incoming HTTP byte stream, not undici's outgoing FormData
  // generator (whose asynchronous encoding is unrelated to server parsing).
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) { controller.close(); return; }
      controller.enqueue(bytes.slice(offset, offset + 512));
      offset += 512;
    },
  });
  const init: RequestInit & { duplex: "half" } = { method: "POST", body: stream, headers: encoded.headers, duplex: "half" };
  return new Request("http://localhost/upload", init);
}
test("multipart parsing preserves fields and files under the total limit", async () => {
  const result = await readMultipart(await request(), 10000);
  assert.equal(result.get("listing"), "test");
  assert.equal((result.get("photos") as File).size, 2000);
});
test("multipart parsing rejects oversized bodies without trusting Content-Length", async () => {
  const incoming = await request();
  assert.equal(incoming.headers.get("content-length"), null);
  await assert.rejects(readMultipart(incoming, 1000), UploadTooLarge);
});
