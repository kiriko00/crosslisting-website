export interface DeletionGateway {
  begin: () => Promise<void>;
  list: () => Promise<{ name: string; id: string | null }[]>;
  remove: (names: string[]) => Promise<void>;
  finish: () => Promise<void>;
}
// Fence mutations before Storage cleanup. Keep the DB item recoverable until
// cleanup succeeds; retries resume the fenced deletion. Never delete metadata first.
export async function deleteInventoryItem(gateway: DeletionGateway) {
  await gateway.begin();
  let previous = "";
  for (;;) {
    const files = await gateway.list();
    if (!files.length) break;
    if (files.some(file => !file.id || !file.name || file.name.includes("/") || file.name === "..")) throw new Error("Unexpected nested folder. Deletion is paused; inspect owned Storage files before retrying.");
    const signature = files.map(file => file.name).join("\n");
    if (signature === previous) throw new Error("Photo removal could not be confirmed. Retry deletion.");
    previous = signature;
    await gateway.remove(files.map(file => file.name));
  }
  await gateway.finish();
}
