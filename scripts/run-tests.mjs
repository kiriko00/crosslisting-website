import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Compile pure TypeScript tests without a runner dependency or Supabase access.
const root = fileURLToPath(new URL("../", import.meta.url));
const output = mkdtempSync(join(tmpdir(), "crosslisting-tests-"));
const tests = ["auth/redirect", "listing/submission", "listing/persist", "listing/multipart", "listing/photo-order", "listing/validation", "inventory/lifecycle", "connectors/delisting"];
try {
  const compile = spawnSync(process.execPath, [
    resolve(root, "node_modules/typescript/bin/tsc"),
    "--module", "commonjs", "--target", "ES2022", "--moduleResolution", "node",
    "--esModuleInterop", "--skipLibCheck", "--strict", "--outDir", output,
    ...tests.map(test => `lib/${test}.test.ts`),
  ], { cwd: root, stdio: "inherit" });
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    const run = spawnSync(process.execPath, ["--test", ...tests.map(test => join(output, `${test}.test.js`))], { cwd: root, stdio: "inherit" });
    process.exitCode = run.status ?? 1;
  }
} finally {
  // This exact directory was created above for this test run; no project files.
  rmSync(output, { recursive: true, force: true });
}
