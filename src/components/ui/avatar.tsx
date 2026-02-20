import { getUserColor } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils";

interface AvatarProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({ userId, username, avatarUrl, size = "md", className }: AvatarProps) {
  const { bg, text } = getUserColor(userId);
  const letter = (username ?? "?").charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={cn("rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-bold select-none", SIZES[size], className)}
      style={{ backgroundColor: bg, color: text }}
    >
      {letter}
    </div>
  );
}
