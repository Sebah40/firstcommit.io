-- ============================================
-- PATHWAY - Comment Likes Counter Trigger
-- ============================================

create or replace function public.update_comment_likes_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.comments set likes_count = likes_count + 1 where id = new.comment_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.comments set likes_count = likes_count - 1 where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_comment_like_change
  after insert or delete on public.comment_likes
  for each row execute function public.update_comment_likes_count();

-- BACKFILL: sync counts from existing data
update public.comments c set
  likes_count = (select count(*) from public.comment_likes where comment_id = c.id);
