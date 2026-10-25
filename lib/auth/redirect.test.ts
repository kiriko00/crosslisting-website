import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNext } from "./redirect";

test("post-auth return paths cannot redirect outside the workspace", () => {
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/auth/callback", "/sign-in", "/%2fevil", "/inventory/../auth/callback", "/inventory/%5cevil", null, "/inventory\r\nHeader: x"]) assert.equal(safeNext(value), "/");
  for (const value of ["/", "/inventory/abc", "/inventory?status=draft", "/create-listing", "/settings"]) assert.equal(safeNext(value), value);
});
