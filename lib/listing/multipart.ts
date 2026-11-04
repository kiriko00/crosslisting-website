export class UploadTooLarge extends Error {}

// Enforce the total limit on streamed/chunked requests too, not just on a
// Content-Length header supplied by the caller. Multipart decoding still buffers
// accepted files; this is bounded, not a resumable/direct-upload implementation.
export async function readMultipart(request: Request, limit: number): Promise<FormData> {
  if (!request.body) throw new Error("Missing upload body");
  const reader = request.body.getReader();
  let total = 0;
  let oversized = false;
  const bounded = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) { controller.close(); return; }
        total += chunk.value.byteLength;
        if (total > limit) {
          oversized = true;
          try { await reader.cancel(); } catch { /* The incoming connection may already be gone. */ }
          controller.error(new UploadTooLarge("The upload is too large."));
          return;
        }
        controller.enqueue(chunk.value);
      } catch (error) { controller.error(error); }
    },
    cancel() { return reader.cancel(); },
  });
  try {
    return await new Response(bounded, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
  } catch (error) {
    if (oversized) throw new UploadTooLarge("The upload is too large.");
    throw error;
  }
}
