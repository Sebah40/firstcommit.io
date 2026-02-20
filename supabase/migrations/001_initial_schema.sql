-- ============================================
-- PATHWAY - Initial Schema
-- ============================================

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  karma integer default 0 not null,
  role text default 'user' not null check (role in ('user', 'admin')),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- CATEGORIES
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  icon text not null,
  description text,
  created_at timestamptz default now() not null
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

-- Seed categories
insert into public.categories (name, slug, icon, description) values
  ('Web Apps', 'web-apps', 'Globe', 'Full-stack and frontend web applications'),
  ('Mobile Apps', 'mobile-apps', 'Smartphone', 'iOS and Android applications'),
  ('APIs & Backend', 'apis-backend', 'Server', 'REST APIs, GraphQL, microservices'),
  ('CLI Tools', 'cli-tools', 'Terminal', 'Command-line interfaces and scripts'),
  ('AI / ML', 'ai-ml', 'Brain', 'AI, machine learning, and data projects'),
  ('Games', 'games', 'Gamepad2', 'Browser and desktop games'),
  ('Automation', 'automation', 'Zap', 'Bots, scrapers, and workflow automation'),
  ('Design & UI', 'design-ui', 'Palette', 'Components, themes, and design systems');

-- POSTS
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  techs text[] default '{}' not null,
  category_id uuid references public.categories(id) on delete set null,
  likes_count integer default 0 not null,
  saves_count integer default 0 not null,
  comments_count integer default 0 not null,
  trending_score float default 0 not null,
  is_hidden boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone"
  on public.posts for select using (not is_hidden);

create policy "Users can create posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- POST MEDIA
create table public.post_media (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  url text not null,
  type text not null check (type in ('image', 'video')),
  "order" integer default 0 not null,
  created_at timestamptz default now() not null
);

alter table public.post_media enable row level security;

create policy "Post media is viewable by everyone"
  on public.post_media for select using (true);

create policy "Users can manage own post media"
  on public.post_media for insert with check (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

create policy "Users can delete own post media"
  on public.post_media for delete using (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

-- CHAT MESSAGES (timeline "how it was made")
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  role text not null check (role in ('human', 'assistant')),
  content text not null,
  tool_action text,
  file_path text,
  "order" integer default 0 not null,
  created_at timestamptz default now() not null
);

alter table public.chat_messages enable row level security;

create policy "Chat messages are viewable by everyone"
  on public.chat_messages for select using (true);

create policy "Users can insert chat messages for own posts"
  on public.chat_messages for insert with check (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

-- COMMENTS (nested)
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  likes_count integer default 0 not null,
  depth integer default 0 not null check (depth <= 3),
  is_hidden boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select using (not is_hidden);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- POST LIKES
create table public.post_likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, post_id)
);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.post_likes for select using (true);

create policy "Users can like posts"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete using (auth.uid() = user_id);

-- POST SAVES
create table public.post_saves (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, post_id)
);

alter table public.post_saves enable row level security;

create policy "Saves are viewable by the user"
  on public.post_saves for select using (auth.uid() = user_id);

create policy "Users can save posts"
  on public.post_saves for insert with check (auth.uid() = user_id);

create policy "Users can unsave posts"
  on public.post_saves for delete using (auth.uid() = user_id);

-- COMMENT LIKES
create table public.comment_likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, comment_id)
);

alter table public.comment_likes enable row level security;

create policy "Comment likes are viewable by everyone"
  on public.comment_likes for select using (true);

create policy "Users can like comments"
  on public.comment_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike comments"
  on public.comment_likes for delete using (auth.uid() = user_id);

-- NOTIFICATIONS
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'comment', 'reply')),
  actor_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Authenticated users can create notifications"
  on public.notifications for insert with check (auth.uid() = actor_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- REPORTS
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now() not null
);

alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert with check (auth.uid() = reporter_id);

-- ============================================
-- INDEXES
-- ============================================
create index idx_posts_user_id on public.posts(user_id);
create index idx_posts_category_id on public.posts(category_id);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_posts_trending on public.posts(trending_score desc);
create index idx_comments_post_id on public.comments(post_id);
create index idx_comments_user_id on public.comments(user_id);
create index idx_comments_parent_id on public.comments(parent_id);
create index idx_chat_messages_post_id on public.chat_messages(post_id, "order");
create index idx_notifications_user_id on public.notifications(user_id, read, created_at desc);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
