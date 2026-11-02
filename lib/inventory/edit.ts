import type { SavedItem } from "../listing/persist";
export interface EditGateway {
  upload: (file: File, path: string) => Promise<void>;
  remove: (paths: string[]) => Promise<void>;
  commit: () => Promise<void>;
  find: () => Promise<(SavedItem & { mutation: string | null }) | null>;
}

export async function persistEdit(gateway: EditGateway, files: File[], paths: string[], mutation: string) {
  const attempted: string[] = [];
  try {
    for (let index=0; index<files.length; index++) {
      attempted.push(paths[index]);
      await gateway.upload(files[index], paths[index]);
    }
    await gateway.commit();
  } catch {
    let saved: Awaited<ReturnType<EditGateway["find"]>>;
    try { saved = await gateway.find(); } catch {
      throw new Error("Save outcome uncertain. Photos were kept private. Retry this unchanged form before starting another edit.");
    }
    const unused = attempted.filter(path => !saved?.paths.includes(path));
    let cleanupFailed = false;
    if (unused.length) try { await gateway.remove(unused); } catch { cleanupFailed = true; }
    if (saved?.mutation === mutation) return { warning: cleanupFailed };
    throw new Error(`Changes were not saved. The item may have changed, a protected marketplace may have been removed, or an upload failed. Reload the item before retrying.${cleanupFailed ? " Unused private uploads need cleanup." : ""}`);
  }
  return { warning: false };
}
