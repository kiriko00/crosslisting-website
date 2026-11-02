import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { PHOTO_BUCKET } from "@/lib/listing/submission";

export async function drainPhotoCleanup(supabase: SupabaseClient<Database>, owner: string, itemId: string) {
  const { data: jobs, error } = await supabase.from("photo_cleanup_jobs").select("id, storage_path").eq("user_id",owner).eq("item_id",itemId).limit(100);
  if (error) throw new Error("Photo cleanup queue unavailable");
  const { data: retained, error: photoError } = await supabase.from("item_photos").select("storage_path").eq("item_id",itemId);
  if (photoError) throw new Error("Cannot verify retained photos");
  const paths = jobs.filter(job => !retained.some(photo => photo.storage_path === job.storage_path)).map(job => job.storage_path);
  if (paths.some(path => !path.startsWith(`${owner}/${itemId}/`))) throw new Error("Invalid owned cleanup path");
  if (paths.length) {
    const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (removeError) throw new Error("Unused photo cleanup failed");
  }
  if (jobs.length) {
    const { error: deleteError } = await supabase.from("photo_cleanup_jobs").delete().eq("user_id",owner).in("id",jobs.map(job=>job.id));
    if (deleteError) throw new Error("Cleanup receipt could not be saved");
  }
  return jobs.length;
}
