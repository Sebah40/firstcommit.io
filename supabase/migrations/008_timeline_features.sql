-- ============================================
-- PATHWAY - Timeline Features
-- ============================================
-- Annotations, Key Moments (Stars), and Chapters
-- for the AI chat timeline.

-- ANNOTATIONS — one per message, author-only creation
create table public.message_annotations (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.chat_messages(id) on delete cascade not null unique,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- STARS — key moment markers
create table public.message_stars (
  message_id uuid references public.chat_messages(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (message_id)
);

-- CHAPTERS — named sections with start/end message orders
create table public.timeline_chapters (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  title text not null,
  start_order integer not null,
  end_order integer not null,
  created_at timestamptz default now() not null
);

-- Counter column on posts
alter table public.posts add column stars_count integer default 0 not null;

-- TRIGGER — auto-increment posts.stars_count
create or replace function public.update_post_stars_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set stars_count = stars_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set stars_count = stars_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_message_star_change
  after insert or delete on public.message_stars
  for each row execute function public.update_post_stars_count();

-- RLS
alter table public.message_annotations enable row level security;
alter table public.message_stars enable row level security;
alter table public.timeline_chapters enable row level security;

-- SELECT: everyone
create policy "Anyone can view annotations"
  on public.message_annotations for select
  using (true);

create policy "Anyone can view stars"
  on public.message_stars for select
  using (true);

create policy "Anyone can view chapters"
  on public.timeline_chapters for select
  using (true);

-- INSERT: post owner only
create policy "Post owner can insert annotations"
  on public.message_annotations for insert
  with check (auth.uid() = (select user_id from public.posts where id = post_id));

create policy "Post owner can insert stars"
  on public.message_stars for insert
  with check (auth.uid() = (select user_id from public.posts where id = post_id));

create policy "Post owner can insert chapters"
  on public.timeline_chapters for insert
  with check (auth.uid() = (select user_id from public.posts where id = post_id));

-- UPDATE: post owner only
create policy "Post owner can update annotations"
  on public.message_annotations for update
  using (auth.uid() = (select user_id from public.posts where id = post_id));

create policy "Post owner can update chapters"
  on public.timeline_chapters for update
  using (auth.uid() = (select user_id from public.posts where id = post_id));

-- DELETE: post owner only
create policy "Post owner can delete annotations"
  on public.message_annotations for delete
  using (auth.uid() = (select user_id from public.posts where id = post_id));

create policy "Post owner can delete stars"
  on public.message_stars for delete
  using (auth.uid() = (select user_id from public.posts where id = post_id));

create policy "Post owner can delete chapters"
  on public.timeline_chapters for delete
  using (auth.uid() = (select user_id from public.posts where id = post_id));

-- INDEXES
create index idx_message_annotations_post_id on public.message_annotations(post_id);
create index idx_message_stars_post_id on public.message_stars(post_id);
create index idx_timeline_chapters_post_id on public.timeline_chapters(post_id);
