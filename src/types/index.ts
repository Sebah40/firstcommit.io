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
  cv_url: string | null;
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
  user_id: string | null;
  title: string;
  hook_description: string;
  techs: string[];
  category_id: string | null;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  trending_score: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  difficulty: Difficulty | null;
  time_estimate_minutes: number | null;
  is_vibe_coded: boolean;
  guide_type: GuideType;
  prerequisites: string[];
  what_youll_build: string | null;
  completions_count: number;
  avg_rating: number | null;
  thumbnail_url: string | null;
  message_count: number;
  files_changed: number;
  highlight_snippet: string | null;
  content: string | null;
  instance_url: string | null;
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

export interface PostStage {
  id: string;
  post_id: string;
  stage_order: number;
  stage_name: string;
  summary: string;
  key_decisions: string[];
  problems_hit: string[];
  duration_messages: number;
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

export interface GuideDetail extends Post {
  stages?: PostStage[];
}

export type SortOption = "recent" | "popular" | "trending" | "completed";

export type ProfileTab = "guides" | "comments" | "liked" | "saved";
