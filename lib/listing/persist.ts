// A small testable coordinator for the non-transactional Storage API and the
// transactional database RPC. The gateway always uses the signed-in user's JWT.
export interface SavedItem { id: string; paths: string[] }
export interface PersistenceGateway {
  find: () => Promise<SavedItem | null>;
  upload: (file: File, path: string) => Promise<void>;
  remove: (paths: string[]) => Promise<void>;
  commit: (paths: string[]) => Promise<{ id: string; created: boolean }>;
}

export async function persistItem(gateway: PersistenceGateway, files: File[], paths: string[]): Promise<{ id: string; warning?: string }> {
  const existing = await gateway.find();
  if (existing) return { id: existing.id };
  // Include attempted uploads: a transport failure may follow a successful upload.
  const attempted: string[] = [];
  async function clean(unreferenced: string[]) {
    if (!unreferenced.length) return false;
    try { await gateway.remove(unreferenced); return false; } catch { return true; }
  }
  try {
    for (let index = 0; index < files.length; index++) {
      attempted.push(paths[index]);
      await gateway.upload(files[index], paths[index]);
    }
  } catch {
    const cleanupFailed = await clean(attempted);
    throw new Error(`Photo upload failed. No inventory item was created. Your form is preserved; retry the save.${cleanupFailed ? " Some private uploads could not be removed; see the cleanup notes in the setup guide." : ""}`);
  }

  try {
    const result = await gateway.commit(paths);
    if (!result.created) {
      const saved = await gateway.find();
      if (!saved) throw new Error("Unable to reconcile duplicate save");
      const cleanupFailed = await clean(attempted.filter(path => !saved.paths.includes(path)));
      return { id: result.id, ...(cleanupFailed ? { warning: "cleanup" } : {}) };
    }
    return { id: result.id };
  } catch {
    // Never delete files blindly after an ambiguous commit response. The DB may
    // have committed even though the response was lost.
    let saved: SavedItem | null;
    try { saved = await gateway.find(); } catch {
      throw new Error("The save could not be confirmed. Photos were kept private to avoid deleting a potentially saved item's files. Retry this same form to recover the result; do not start a second item yet.");
    }
    if (saved) {
      const cleanupFailed = await clean(attempted.filter(path => !saved.paths.includes(path)));
      return { id: saved.id, ...(cleanupFailed ? { warning: "cleanup" } : {}) };
    }
    const cleanupFailed = await clean(attempted);
    throw new Error(`The database save failed. No inventory record was saved. Check that the new save migration is applied, then retry.${cleanupFailed ? " Some private uploads could not be removed; see the cleanup notes in the setup guide." : ""}`);
  }
}
