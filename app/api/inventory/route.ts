import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listingPayload, masterPayload, MAX_PHOTOS, MAX_PHOTO_BYTES, parseSubmission, photoExtensions, PHOTO_BUCKET, uuidPattern, validatePhoto } from "@/lib/listing/submission";
import { persistItem, type PersistenceGateway } from "@/lib/listing/persist";
import { readMultipart, UploadTooLarge } from "@/lib/listing/multipart";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  // Route handlers do not inherit Server Actions' same-origin CSRF checks.
  if (request.headers.get("origin") !== request.nextUrl.origin) return reply({ error: "This request must come from your Crosslisting workspace." }, 403);
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  const owner = auth?.claims.sub;
  if (authError || !owner) return reply({ error: "Your session expired. Sign in again before saving." }, 401);

  const length = Number(request.headers.get("content-length"));
  const maxBody = MAX_PHOTOS * MAX_PHOTO_BYTES + 200000;
  if (length > maxBody) return reply({ error: "The upload is too large." }, 413);
  let body: FormData;
  try { body = await readMultipart(request, maxBody); } catch (error) {
    return reply({ error: error instanceof UploadTooLarge ? "The upload is too large." : "The upload could not be read. Please retry." }, error instanceof UploadTooLarge ? 413 : 400);
  }
  const id = body.get("submissionId");
  if (typeof id !== "string" || !uuidPattern.test(id)) return reply({ error: "Invalid submission ID. Reload the form." }, 400);
  const mode = body.get("mode");
  if (mode !== "draft" && mode !== "prepare") return reply({ error: "Invalid save action." }, 400);
  const entries = body.getAll("photos");
  if (entries.length > MAX_PHOTOS || entries.some(entry => !(entry instanceof File))) return reply({ error: "Choose at most 12 photo files." }, 400);
  const files = entries as File[];
  let form;
  try {
    const raw = body.get("listing");
    if (typeof raw !== "string" || raw.length > 150000) throw new Error("Listing data is too large or invalid.");
    form = parseSubmission(JSON.parse(raw), mode === "prepare", files.length);
    for (const file of files) await validatePhoto(file);
  } catch (error) {
    return reply({ error: error instanceof Error && !(error instanceof SyntaxError) ? error.message : "The listing data could not be read." }, 400);
  }
  const paths = files.map(file => `${owner}/${id}/${crypto.randomUUID()}.${photoExtensions[file.type as keyof typeof photoExtensions]}`);
  const gateway: PersistenceGateway = {
    async find() {
      const { data, error } = await supabase.from("inventory_items").select("id, item_photos(storage_path)").eq("id", id).eq("user_id", owner).maybeSingle();
      if (error) throw new Error("Unable to confirm save");
      return data ? { id: data.id, paths: data.item_photos.map(photo => photo.storage_path) } : null;
    },
    async upload(file, path) {
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error("Upload failed");
    },
    async remove(uploaded) {
      const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(uploaded);
      if (error) throw new Error("Cleanup failed");
    },
    async commit(uploaded) {
      const { data, error } = await supabase.rpc("create_inventory_item", {
        p_id: id, p_master: masterPayload(form.master), p_listings: listingPayload(form, files.length),
        p_photos: uploaded.map((storage_path, sort_order) => ({ storage_path, sort_order })),
      });
      if (error || !data || typeof data !== "object" || Array.isArray(data) || data.id !== id || typeof data.created !== "boolean") throw new Error("Commit failed");
      return { id, created: data.created };
    },
  };
  try {
    const result = await persistItem(gateway, files, paths);
    return reply({ id: result.id, ...(result.warning ? { warning: result.warning } : {}) });
  } catch (error) {
    // Only our own operational messages are exposed, not SQL/auth payloads.
    return reply({ error: error instanceof Error ? error.message : "Save failed. Your form is still available." }, 500);
  }
}
