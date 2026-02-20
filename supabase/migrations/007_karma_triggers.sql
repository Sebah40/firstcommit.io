-- ============================================
-- PATHWAY - Karma Triggers
-- ============================================
-- Posts give +1 karma to the author.
-- Likes give +3 karma to the post author (no self-likes).

-- POST KARMA (+1 per post)
create or replace function public.update_karma_on_post()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set karma = karma + 1 where id = new.user_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.profiles set karma = karma - 1 where id = old.user_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_karma
  after insert or delete on public.posts
  for each row execute function public.update_karma_on_post();

-- LIKE KARMA (+3 per like, no self-likes)
create or replace function public.update_karma_on_like()
returns trigger as $$
declare
  post_author uuid;
begin
  select user_id into post_author from public.posts where id = new.post_id;

  -- Skip self-likes
  if (tg_op = 'INSERT') then
    if new.user_id != post_author then
      update public.profiles set karma = karma + 3 where id = post_author;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    select user_id into post_author from public.posts where id = old.post_id;
    if old.user_id != post_author then
      update public.profiles set karma = karma - 3 where id = post_author;
    end if;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_karma
  after insert or delete on public.post_likes
  for each row execute function public.update_karma_on_like();

-- BACKFILL: reset and recalculate all karma
update public.profiles set karma = 0;

-- +1 per post
update public.profiles p set karma = karma + sub.cnt
from (select user_id, count(*) as cnt from public.posts group by user_id) sub
where p.id = sub.user_id;

-- +3 per non-self like
update public.profiles p set karma = karma + sub.cnt * 3
from (
  select po.user_id, count(*) as cnt
  from public.post_likes pl
  join public.posts po on po.id = pl.post_id
  where pl.user_id != po.user_id
  group by po.user_id
) sub
where p.id = sub.user_id;
