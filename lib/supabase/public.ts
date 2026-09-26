import { createClient } from "@supabase/supabase-js";
import type { FeedItem, Media, Post, Thread } from "@/types/content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && key && !url.includes("your-project"));
export const supabase = isSupabaseConfigured ? createClient(url!, key!) : null;

const demoPosts: Post[] = [
  { id: "welcome", type: "post", title: null, slug: null, content: { text: "This is my corner of the internet." }, excerpt: null, status: "published", created_at: "2025-01-01T12:00:00Z", updated_at: "2025-01-01T12:00:00Z", published_at: "2025-01-01T12:00:00Z", media: [] },
  { id: "essay", type: "article", title: "Writing in public, without the noise", slug: "writing-in-public", content: { blocks: [{ type: "paragraph", text: "A small place for notes, experiments, photographs, and longer ideas." }] }, excerpt: "A small place for notes, experiments, photographs, and longer ideas.", status: "published", created_at: "2025-01-02T12:00:00Z", updated_at: "2025-01-02T12:00:00Z", published_at: "2025-01-02T12:00:00Z", media: [] }
];

const sortMedia = (media: Media[] = []) => media.sort((a, b) => a.position - b.position);
const normaliseThread = (thread: Thread): Thread => ({ ...thread, thread_items: (thread.thread_items || []).sort((a, b) => a.position - b.position).map((item) => ({ ...item, content: item.content || {}, media: sortMedia(item.media || []) })) });

export function getPublishedPosts(onlyArticles: true): Promise<Post[]>;
export function getPublishedPosts(onlyArticles?: false): Promise<FeedItem[]>;
export async function getPublishedPosts(onlyArticles = false): Promise<FeedItem[] | Post[]> {
  if (!supabase) return onlyArticles ? demoPosts.filter((post) => post.type === "article") : demoPosts;
  let query = supabase.from("posts").select("*, media(*) ").eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false });
  if (onlyArticles) query = query.eq("type", "article");
  const { data: posts } = await query;
  const normalPosts = (posts || []).map((post) => ({ ...post, content: post.content || {}, media: sortMedia(post.media || []) })) as Post[];
  if (onlyArticles) return normalPosts;
  // Threads were added after posts. A missing migration leaves the old feed usable.
  const { data: threads } = await supabase.from("threads").select("*, thread_items(*, media(*))").eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false });
  return [...normalPosts, ...((threads || []).map(normaliseThread) as Thread[])].sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
}

export async function getArticle(slug: string) {
  const articles = await getPublishedPosts(true);
  return (articles as Post[]).find((post) => post.slug === slug) || null;
}
