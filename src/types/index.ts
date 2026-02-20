export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  karma: number;
  role: UserRole;
  show_likes: boolean;
  show_saves: boolean;
  github_url: string | null;
  linkedin_url: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type GuideType =
  | "full_app"
  | "component"
  | "integration"
  | "automation"
  | "game"
  | "cli_tool"
  | "chrome_extension"
  | "other";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string;
  techs: string[];
  category_id: string | null;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  stars_count: number;
  trending_score: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  // Guide fields
  difficulty: Difficulty | null;
  time_estimate_minutes: number | null;
  is_vibe_coded: boolean;
  guide_type: GuideType;
  prerequisites: string[];
  what_youll_build: string | null;
  original_json: string | null;
  completions_count: number;
  avg_rating: number | null;
  // Joined
  profile?: Profile;
  category?: Category;
  media?: PostMedia[];
}

export type Guide = Post;

export interface PostMedia {
  id: string;
  post_id: string;
  url: string;
  type: "image" | "video";
  order: number;
}

export interface MessageAnnotation {
  id: string;
  message_id: string;
  post_id: string;
  content: string;
  created_at: string;
}

export interface TimelineChapter {
  id: string;
  post_id: string;
  title: string;
  start_order: number;
  end_order: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  post_id: string;
  role: "human" | "assistant";
  content: string;
  tool_action: string | null;
  file_path: string | null;
  order: number;
  // Joined
  annotation?: MessageAnnotation;
  is_starred?: boolean;
}

export interface GuideStep {
  id: string;
  post_id: string;
  title: string;
  description: string | null;
  author_annotation: string | null;
  suggested_prompt: string | null;
  checkpoint_description: string | null;
  checkpoint_media_url: string | null;
  order: number;
  created_at: string;
}

export interface GuideBlock {
  id: string;
  post_id: string;
  role: "human" | "assistant";
  content: string;
  tool_action: string | null;
  file_path: string | null;
  original_order: number;
  auto_category: "scaffold" | "feature" | "bug_fix" | "refactor" | "question" | "file_change" | "command" | null;
  files_touched: string[];
  created_at: string;
}

export interface StepBlock {
  id: string;
  step_id: string;
  block_id: string;
  position: number;
  display_mode: "full" | "collapsed" | "trimmed" | "ghost";
  author_note: string | null;
  created_at: string;
}

export interface GuideCompletion {
  id: string;
  post_id: string;
  user_id: string;
  rating: number | null;
  review: string | null;
  completed_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  depth: number;
  is_hidden: boolean;
  created_at: string;
  // Joined
  profile?: Profile;
  replies?: Comment[];
  post?: { id: string; title: string };
}

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "reply";
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  // Joined
  actor?: Profile;
  post?: Post;
}

export interface PostDetail extends Post {
  chat_messages?: ChatMessage[];
  timeline_chapters?: TimelineChapter[];
  guide_steps?: GuideStep[];
  guide_blocks?: GuideBlock[];
}

export type GuideDetail = PostDetail;

export type SortOption = "recent" | "popular" | "trending" | "completed";

export type ProfileTab = "guides" | "comments" | "liked" | "saved";
