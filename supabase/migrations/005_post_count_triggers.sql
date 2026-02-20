-- ============================================
-- PATHWAY - Post Counter Triggers
-- ============================================
-- Automatically keep likes_count, saves_count, and comments_count
-- in sync when rows are inserted/deleted in the junction tables.

-- LIKES COUNT
create or replace function public.update_post_likes_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = likes_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute function public.update_post_likes_count();

-- SAVES COUNT
create or replace function public.update_post_saves_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set saves_count = saves_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set saves_count = saves_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_save_change
  after insert or delete on public.post_saves
  for each row execute function public.update_post_saves_count();

-- COMMENTS COUNT
create or replace function public.update_post_comments_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set comments_count = comments_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_comment_change
  after insert or delete on public.comments
  for each row execute function public.update_post_comments_count();

-- BACKFILL: sync counts from existing data
update public.posts p set
  likes_count    = (select count(*) from public.post_likes  where post_id = p.id),
  saves_count    = (select count(*) from public.post_saves  where post_id = p.id),
  comments_count = (select count(*) from public.comments    where post_id = p.id and is_hidden = false);
