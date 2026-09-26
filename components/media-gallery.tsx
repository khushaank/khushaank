"use client";
import { useState } from "react";
import type { Media } from "@/types/content";
import { Icon } from "./icons";

export function MediaGallery({ media }: { media: Media[] }) {
  const [selected, setSelected] = useState<Media | null>(null);
  if (!media.length) return null;
  const count = Math.min(media.length, 4);
  return <><div className={`mt-2.5 grid max-h-[520px] gap-1 overflow-hidden rounded-xl ${count === 1 ? "grid-cols-1" : "grid-cols-2"}`}>{media.slice(0, 4).map((image, index) => <button key={image.id || image.url} onClick={() => setSelected(image)} className={`relative overflow-hidden bg-zinc-100 ${count === 1 ? "" : "aspect-[4/3]"} ${count === 3 && index === 0 ? "row-span-2" : ""}`}><img src={image.url} alt={image.alt || "Published image"} className={count === 1 ? "max-h-[520px] w-full object-contain" : "absolute inset-0 size-full object-cover"} />{index === 3 && media.length > 4 && <span className="absolute inset-0 grid place-items-center bg-black/45 text-xl font-semibold text-white">+{media.length - 4}</span>}</button>)}</div>{selected && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setSelected(null)}><button aria-label="Close image" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"><Icon name="close" className="size-5" /></button><img src={selected.url} alt={selected.alt || "Published image"} className="max-h-[90vh] max-w-full rounded-lg object-contain" /></div>}</>;
}
