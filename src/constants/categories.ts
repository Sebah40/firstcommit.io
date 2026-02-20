import type { Category } from "@/types";

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Web Apps", slug: "web-apps", icon: "Globe", description: "Full-stack and frontend web applications" },
  { name: "Mobile Apps", slug: "mobile-apps", icon: "Smartphone", description: "iOS and Android applications" },
  { name: "APIs & Backend", slug: "apis-backend", icon: "Server", description: "REST APIs, GraphQL, microservices" },
  { name: "CLI Tools", slug: "cli-tools", icon: "Terminal", description: "Command-line interfaces and scripts" },
  { name: "AI / ML", slug: "ai-ml", icon: "Brain", description: "AI, machine learning, and data projects" },
  { name: "Games", slug: "games", icon: "Gamepad2", description: "Browser and desktop games" },
  { name: "Automation", slug: "automation", icon: "Zap", description: "Bots, scrapers, and workflow automation" },
  { name: "Design & UI", slug: "design-ui", icon: "Palette", description: "Components, themes, and design systems" },
];
