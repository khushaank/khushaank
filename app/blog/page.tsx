import Link from "next/link";
import { getPublishedPosts } from "@/lib/supabase/public";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Blog · Khushaank", description: "Essays by Khushaank." };
export default async function BlogPage() { const posts = await getPublishedPosts(true); return <><PageHeader title="Blog" subtitle="Longer writing, deeper thoughts." /><div>{posts.length ? posts.map((post) => <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-4 border-b border-zinc-200 px-5 py-5 transition hover:bg-zinc-50"><div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold leading-5 tracking-[-.02em]">{post.title}</h2><p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-500">{post.excerpt}</p><p className="mt-2.5 text-[11px] text-zinc-400">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(post.published_at || post.created_at))} · {Math.max(1, Math.ceil((post.content.blocks || []).map((block) => block.text).join(" ").split(/\s+/).length / 220))} min read</p></div>{post.media?.[0] && <img src={post.media[0].url} alt={post.media[0].alt || "Article cover"} className="size-24 shrink-0 rounded-lg object-cover" />}<IconArrow /></Link>) : <EmptyState>Long-form articles will live here.</EmptyState>}</div></>; }
function IconArrow() { return <span className="self-center text-zinc-400">›</span>; }
