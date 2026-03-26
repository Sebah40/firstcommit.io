-- Auto-create notifications on likes, comments, and follows
-- Notifications are NOT created when a user acts on their own content.

-- Notification on post like
create or replace function notify_post_like()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = NEW.post_id;
  if post_owner is not null and post_owner != NEW.user_id then
    insert into public.notifications (user_id, type, actor_id, post_id)
    values (post_owner, 'like', NEW.user_id, NEW.post_id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_post_like on public.post_likes;
create trigger trg_notify_post_like
  after insert on public.post_likes
  for each row execute function notify_post_like();

-- Notification on comment (notify post owner)
create or replace function notify_comment()
returns trigger as $$
declare
  post_owner uuid;
  parent_owner uuid;
  notif_type text;
  notif_user uuid;
begin
  -- Determine notification target
  if NEW.parent_id is not null then
    -- Reply: notify the parent comment author
    select user_id into parent_owner from public.comments where id = NEW.parent_id;
    notif_type := 'reply';
    notif_user := parent_owner;
  else
    -- Top-level comment: notify the post owner
    select user_id into post_owner from public.posts where id = NEW.post_id;
    notif_type := 'comment';
    notif_user := post_owner;
  end if;

  if notif_user is not null and notif_user != NEW.user_id then
    insert into public.notifications (user_id, type, actor_id, post_id, comment_id)
    values (notif_user, notif_type, NEW.user_id, NEW.post_id, NEW.id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment
  after insert on public.comments
  for each row execute function notify_comment();

-- Notification on follow (add 'follow' to the check constraint first)
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('like', 'comment', 'reply', 'follow'));

create or replace function notify_follow()
returns trigger as $$
begin
  if NEW.following_id != NEW.follower_id then
    insert into public.notifications (user_id, type, actor_id)
    values (NEW.following_id, 'follow', NEW.follower_id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow
  after insert on public.follows
  for each row execute function notify_follow();
