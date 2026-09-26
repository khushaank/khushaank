"use client";

import { useState } from "react";
import type { FeedItem, Post, ThreadItem } from "@/types/content";
import { isThread } from "@/types/content";
import { CodeBlock } from "./code-block";
import { Icon } from "./icons";
import { MediaGallery } from "./media-gallery";

function stamp(date: string | null) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date || 0)); }

function Menu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const copy = async () => { await navigator.clipboard?.writeText(`${location.origin}/#${id}`); setOpen(false); };
  return <div className="relative ml-auto"><button onClick={() => setOpen(!open)} aria-label="Post options" className="-mr-2 -mt-1 rounded-full p-2 text-zinc-400 hover:bg-zinc-100"><span className="block text-lg leading-none tracking-[.08em]">···</span></button>{open && <div className="absolute right-0 top-7 z-10 w-32 rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-sm"><button onClick={copy} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50"><Icon name="copy" className="size-3.5" />Copy link</button></div>}</div>;
}

function Avatar({ connected }: { connected?: boolean }) { return <div className="relative flex w-9 shrink-0 justify-center"><div className="z-[1] grid size-9 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">K</div>{connected && <span className="absolute top-9 bottom-[-18px] w-px bg-zinc-300" />}</div>; }

function ThreadBody({ item, date, last }: { item: ThreadItem; date: string | null; last: boolean }) {
  return <div className="flex gap-3"><Avatar connected={!last} /><div className="min-w-0 flex-1 pb-4"><div className="flex items-center gap-2 text-[13px]"><span className="font-semibold">Khushaank</span>{date && <time className="text-zinc-400">{stamp(date)}</time>}</div>{item.content.text && <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-[1.42]">{item.content.text}</p>}{item.content.code && <div className="mt-2.5"><CodeBlock {...item.content.code} /></div>}<MediaGallery media={item.media || []} /></div></div>;
}

function LegacyPost({ post }: { post: Post }) {
  const text = post.content.text;
  return <div className="flex gap-3"><Avatar /><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[13px]"><span className="font-semibold">Khushaank</span><time className="text-zinc-400">{stamp(post.published_at || post.created_at)}</time><Menu id={post.id} /></div>{post.type === "article" ? <a href={`/blog/${post.slug}`} className="mt-2 flex gap-3 transition hover:opacity-70"><div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold leading-5 tracking-[-.02em]">{post.title}</h2><p className="mt-1.5 line-clamp-3 text-[13px] leading-5 text-zinc-500">{post.excerpt}</p><span className="mt-2.5 inline-flex text-xs font-medium">Read article →</span></div>{post.media?.[0] && <img src={post.media[0].url} alt={post.media[0].alt || "Article cover"} className="size-24 shrink-0 rounded-lg object-cover" />}</a> : <>{text && <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-[1.42]">{text}</p>}{post.content.code && <div className="mt-2.5"><CodeBlock {...post.content.code} /></div>}<MediaGallery media={post.media || []} /></>}</div></div>;
}

export function PostCard({ post }: { post: FeedItem }) {
  return <article id={post.id} className="border-b border-zinc-200 px-5 py-4">{isThread(post) ? <div className="relative">{post.thread_items.map((item, index) => <ThreadBody key={item.id} item={item} date={index === 0 ? post.published_at || post.created_at : null} last={index === post.thread_items.length - 1} />)}<div className="absolute right-0 top-0"><Menu id={post.id} /></div></div> : <LegacyPost post={post} />}</article>;
}
