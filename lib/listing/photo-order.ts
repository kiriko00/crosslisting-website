import type { LocalPhoto } from "./types";

export function reorderPhotos(photos: LocalPhoto[], sourceId: string, targetId: string): LocalPhoto[] {
  const from = photos.findIndex(photo => photo.id === sourceId);
  const to = photos.findIndex(photo => photo.id === targetId);
  if (from < 0 || to < 0 || from === to) return photos;
  const ordered = [...photos];
  const [photo] = ordered.splice(from, 1);
  ordered.splice(to, 0, photo);
  return ordered;
}
