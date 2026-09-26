export type Media = { id?: string; url: string; alt: string; position: number; thread_item_id?: string | null };
export type CodeBlock = { language: string; source: string };
export type ArticleBlock = { type: "paragraph" | "heading" | "quote" | "list" | "code" | "image"; text: string; language?: string; src?: string; alt?: string };
export type PostContent = { text?: string; code?: CodeBlock; blocks?: ArticleBlock[] };
export type Post = {
  id: string;
  type: "post" | "article";
  title: string | null;
  slug: string | null;
  content: PostContent;
  excerpt: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  media?: Media[];
};
export type ThreadItem = { id: string; thread_id: string; position: number; content: PostContent; created_at: string; media?: Media[] };
export type Thread = {
  id: string; author_id?: string | null; status: "draft" | "published"; created_at: string; updated_at: string;
  published_at: string | null; deleted_at?: string | null; thread_items: ThreadItem[];
};
export type FeedItem = Post | Thread;
export function isThread(item: FeedItem): item is Thread { return "thread_items" in item; }
