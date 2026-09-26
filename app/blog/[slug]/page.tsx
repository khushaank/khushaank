import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/article-content";
import { getArticle, getPublishedPosts } from "@/lib/supabase/public";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export async function generateStaticParams() {
  const articles = await getPublishedPosts(true);
  const params = articles.filter((article) => article.slug).map((article) => ({ slug: article.slug! }));
  return params.length ? params : [{ slug: "__placeholder__" }];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return {};
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blog/${article.slug}`;
  return { title: `${article.title} · Khushaank`, description: article.excerpt || undefined, alternates: { canonical: url }, openGraph: { type: "article", title: article.title || "Khushaank", description: article.excerpt || undefined, url, images: article.media?.[0] ? [{ url: article.media[0].url }] : undefined } };
}
export default async function ArticlePage({ params }: Props) {
  const slug = (await params).slug;
  if (slug === "__placeholder__") return null;
  const article = await getArticle(slug);
  if (!article) notFound();
  return <article className="px-5 pb-16 pt-7"><Link href="/blog" className="text-xs text-zinc-500 hover:text-zinc-950">← Back to Blog</Link><p className="mt-7 text-sm text-zinc-500">{new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(article.published_at || article.created_at))}</p><h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-[-.055em]">{article.title}</h1>{article.excerpt && <p className="mt-5 text-lg leading-8 text-zinc-600">{article.excerpt}</p>}{article.media?.[0] && <img src={article.media[0].url} alt={article.media[0].alt || "Article cover"} className="mt-8 aspect-[16/9] w-full rounded-xl object-cover" />}<div className="mt-9"><ArticleContent blocks={article.content.blocks} /></div></article>;
}
