-- Run this once in the Supabase SQL editor after creating the project.
create extension if not exists pgcrypto;

-- This is the only author account. Match it to NEXT_PUBLIC_ADMIN_EMAIL in .env.local.
create or replace function public.is_admin()
returns boolean language sql stable
as $$ select (select auth.uid()) is not null and lower(coalesce(auth.jwt() ->> 'email', '')) = 'khushaankgupta@gmail.com' $$;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) default auth.uid(),
  type text not null check (type in ('post', 'article')),
  title text,
  slug text,
  content jsonb not null default '{}'::jsonb,
  excerpt text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz
);
create unique index if not exists posts_slug_published_unique on public.posts (slug) where slug is not null and deleted_at is null;
create index if not exists posts_feed_index on public.posts (published_at desc) where status = 'published' and deleted_at is null;
create index if not exists posts_admin_index on public.posts (updated_at desc) where deleted_at is null;

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  alt text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists media_post_position_index on public.media (post_id, position);

-- Threads are separate from legacy posts so existing single posts and articles stay intact.
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) default auth.uid(),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz
);
create index if not exists threads_feed_index on public.threads (published_at desc) where status = 'published' and deleted_at is null;
create index if not exists threads_admin_index on public.threads (updated_at desc) where deleted_at is null;

create table if not exists public.thread_items (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  position integer not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (thread_id, position)
);
create index if not exists thread_items_thread_position_index on public.thread_items (thread_id, position);

alter table public.media add column if not exists thread_item_id uuid references public.thread_items(id) on delete cascade;
alter table public.media alter column post_id drop not null;
create index if not exists media_thread_item_position_index on public.media (thread_item_id, position) where thread_item_id is not null;

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);
create index if not exists visits_created_at_index on public.visits (created_at desc);

alter table public.posts enable row level security;
alter table public.media enable row level security;
alter table public.threads enable row level security;
alter table public.thread_items enable row level security;
alter table public.visits enable row level security;

revoke all on public.posts, public.media, public.visits from anon, authenticated;
revoke all on public.threads, public.thread_items from anon, authenticated;
grant select on public.posts, public.media to anon;
grant select, insert, update, delete on public.posts, public.media to authenticated;
grant select on public.threads, public.thread_items to anon;
grant select, insert, update, delete on public.threads, public.thread_items to authenticated;
grant select on public.visits to authenticated;

drop policy if exists "published posts are public" on public.posts;
drop policy if exists "admin manages posts" on public.posts;
drop policy if exists "public reads published posts" on public.posts;
drop policy if exists "admin reads posts" on public.posts;
drop policy if exists "admin creates posts" on public.posts;
drop policy if exists "admin updates posts" on public.posts;
drop policy if exists "admin deletes posts" on public.posts;
create policy "public reads published posts" on public.posts for select to anon using (status = 'published' and deleted_at is null);
create policy "admin reads posts" on public.posts for select to authenticated using (public.is_admin());
create policy "admin creates posts" on public.posts for insert to authenticated with check (public.is_admin() and author_id = (select auth.uid()));
create policy "admin updates posts" on public.posts for update to authenticated using (public.is_admin()) with check (public.is_admin() and author_id = (select auth.uid()));
create policy "admin deletes posts" on public.posts for delete to authenticated using (public.is_admin());

drop policy if exists "public reads published threads" on public.threads;
drop policy if exists "admin reads threads" on public.threads;
drop policy if exists "admin creates threads" on public.threads;
drop policy if exists "admin updates threads" on public.threads;
drop policy if exists "admin deletes threads" on public.threads;
create policy "public reads published threads" on public.threads for select to anon using (status = 'published' and deleted_at is null);
create policy "admin reads threads" on public.threads for select to authenticated using (public.is_admin());
create policy "admin creates threads" on public.threads for insert to authenticated with check (public.is_admin() and author_id = (select auth.uid()));
create policy "admin updates threads" on public.threads for update to authenticated using (public.is_admin()) with check (public.is_admin() and author_id = (select auth.uid()));
create policy "admin deletes threads" on public.threads for delete to authenticated using (public.is_admin());

drop policy if exists "public reads thread items" on public.thread_items;
drop policy if exists "admin reads thread items" on public.thread_items;
drop policy if exists "admin creates thread items" on public.thread_items;
drop policy if exists "admin updates thread items" on public.thread_items;
drop policy if exists "admin deletes thread items" on public.thread_items;
create policy "public reads thread items" on public.thread_items for select to anon using (exists (select 1 from public.threads where threads.id = thread_items.thread_id and threads.status = 'published' and threads.deleted_at is null));
create policy "admin reads thread items" on public.thread_items for select to authenticated using (public.is_admin());
create policy "admin creates thread items" on public.thread_items for insert to authenticated with check (public.is_admin());
create policy "admin updates thread items" on public.thread_items for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes thread items" on public.thread_items for delete to authenticated using (public.is_admin());

drop policy if exists "media for visible posts is public" on public.media;
drop policy if exists "admin manages media" on public.media;
drop policy if exists "public reads published media" on public.media;
drop policy if exists "admin reads media" on public.media;
drop policy if exists "admin creates media" on public.media;
drop policy if exists "admin updates media" on public.media;
drop policy if exists "admin deletes media" on public.media;
create policy "public reads published media" on public.media for select to anon using (
  exists (select 1 from public.posts where posts.id = media.post_id and posts.status = 'published' and posts.deleted_at is null)
  or exists (select 1 from public.thread_items join public.threads on threads.id = thread_items.thread_id where thread_items.id = media.thread_item_id and threads.status = 'published' and threads.deleted_at is null)
);
create policy "admin reads media" on public.media for select to authenticated using (public.is_admin());
create policy "admin creates media" on public.media for insert to authenticated with check (public.is_admin());
create policy "admin updates media" on public.media for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes media" on public.media for delete to authenticated using (public.is_admin());

drop policy if exists "admin reads visits" on public.visits;
create policy "admin reads visits" on public.visits for select to authenticated using (public.is_admin());

create or replace function public.record_visit()
returns void language plpgsql security definer set search_path = public
as $$ begin insert into public.visits default values; end; $$;
revoke all on function public.record_visit() from public;
grant execute on function public.record_visit() to anon, authenticated;

insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do update set public = true;
drop policy if exists "public media files" on storage.objects;
drop policy if exists "admin uploads media files" on storage.objects;
drop policy if exists "admin updates media files" on storage.objects;
drop policy if exists "admin deletes media files" on storage.objects;
create policy "public media files" on storage.objects for select using (bucket_id = 'media');
create policy "admin uploads media files" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "admin updates media files" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "admin deletes media files" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
