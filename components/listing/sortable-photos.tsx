import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import type { LocalPhoto } from "@/lib/listing/types";

interface SortablePhotosProps {
  photos: LocalPhoto[];
  reorder: (sourceId: string, targetId: string) => void;
  remove: (id: string) => void;
}

export function SortablePhotos({ photos, reorder, remove }: SortablePhotosProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const drag = useRef<{ source: string; target: string; pointerId: number } | null>(null);

  function move(sourceId: string, targetId: string) {
    const index = photos.findIndex(photo => photo.id === targetId);
    const photo = photos.find(photo => photo.id === sourceId);
    if (!photo || index < 0 || sourceId === targetId) return;
    reorder(sourceId, targetId);
    setAnnouncement(`${photo.name} moved to position ${index + 1} of ${photos.length}.${index === 0 ? " Now the preview photo." : ""}`);
  }

  function finish(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (!cancelled) move(drag.current.source, drag.current.target);
    drag.current = null;
    setDragging(null);
    setTarget(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="space-y-3">
      <p id="photo-order-help" className="text-xs leading-5 text-muted-foreground">
        Drag a handle to reorder. The first image is the Preview photo. Use arrow keys on a handle, or Earlier / Later buttons.
      </p>
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
      <ol aria-label="Ordered item photos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            data-photo-id={photo.id}
            className={`min-w-0 overflow-hidden rounded-md border bg-surface ${target === photo.id && target !== dragging ? "border-brand ring-2 ring-brand/30" : "border-border"} ${dragging === photo.id ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-1 border-b border-border px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">{index === 0 ? <span className="text-brand">Preview photo</span> : `Photo ${index + 1}`}</span>
              <button
                type="button"
                aria-label={`Reorder ${photo.name}, position ${index + 1} of ${photos.length}`}
                aria-describedby="photo-order-help"
                className="grid size-9 shrink-0 touch-none cursor-grab place-items-center rounded text-muted-foreground hover:bg-surface-subtle active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-brand"
                onPointerDown={event => {
                  if (!event.isPrimary || event.button !== 0) return;
                  event.currentTarget.focus();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  drag.current = { source: photo.id, target: photo.id, pointerId: event.pointerId };
                  setDragging(photo.id);
                  setTarget(photo.id);
                }}
                onPointerMove={event => {
                  if (drag.current?.pointerId !== event.pointerId) return;
                  const card = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-photo-id]");
                  if (card?.dataset.photoId) {
                    drag.current.target = card.dataset.photoId;
                    setTarget(card.dataset.photoId);
                  }
                  if (event.clientY < 80) window.scrollBy(0, -16);
                  else if (event.clientY > window.innerHeight - 80) window.scrollBy(0, 16);
                }}
                onPointerUp={event => finish(event)}
                onPointerCancel={event => finish(event, true)}
                onLostPointerCapture={() => { drag.current = null; setDragging(null); setTarget(null); }}
                onKeyDown={event => {
                  if (event.key === "Escape") { drag.current = null; setDragging(null); setTarget(null); return; }
                  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? photos.length - 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? index - 1 : ["ArrowRight", "ArrowDown"].includes(event.key) ? index + 1 : null;
                  if (nextIndex === null) return;
                  event.preventDefault();
                  if (photos[nextIndex]) move(photo.id, photos[nextIndex].id);
                }}
              >
                <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="currentColor">{[4, 8, 12].map(y => <g key={y}><circle cx="5" cy={y} r="1" /><circle cx="11" cy={y} r="1" /></g>)}</svg>
              </button>
            </div>
            <div className="relative aspect-square bg-surface-subtle">{photo.url ? <Image draggable={false} src={photo.url} alt={`Photo ${index + 1}: ${photo.name}`} fill unoptimized sizes="240px" className="object-contain" /> : <span className="grid h-full place-items-center text-xs text-muted-foreground">Photo temporarily unavailable</span>}</div>
            <div className="space-y-2 p-2.5">
              <p className="truncate text-xs text-muted-foreground" title={photo.name}>{photo.name}</p>
              <div className="flex gap-2">
                <button type="button" disabled={index === 0} aria-label={`Move ${photo.name} earlier`} className="min-h-8 text-xs text-brand underline underline-offset-2 disabled:text-muted-foreground disabled:no-underline disabled:opacity-50" onClick={() => move(photo.id, photos[index - 1].id)}>Earlier</button>
                <button type="button" disabled={index === photos.length - 1} aria-label={`Move ${photo.name} later`} className="min-h-8 text-xs text-brand underline underline-offset-2 disabled:text-muted-foreground disabled:no-underline disabled:opacity-50" onClick={() => move(photo.id, photos[index + 1].id)}>Later</button>
              </div>
              <button type="button" aria-label={`Remove ${photo.name}`} className="min-h-8 text-xs text-red-700 underline underline-offset-2" onClick={() => { remove(photo.id); setAnnouncement(`${photo.name} removed.${index === 0 && photos[1] ? ` ${photos[1].name} is now the preview photo.` : ""}`); }}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
