import { PostCard } from "@/components/post-card";
import { VisitTracker } from "@/components/visit-tracker";
import { getPublishedPosts } from "@/lib/supabase/public";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function HomePage() {
  const posts = await getPublishedPosts();
  return <><VisitTracker /><PageHeader title="Home" /><section aria-label="Publishing feed">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <EmptyState>Your posts will appear here as one continuous feed.</EmptyState>}</section></>;
}
