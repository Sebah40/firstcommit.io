export const TECH_COLORS: Record<string, string> = {
  "TypeScript": "#3178c6",
  "JavaScript": "#f7df1e",
  "React": "#61dafb",
  "Next.js": "#000000",
  "Vue": "#4fc08d",
  "Svelte": "#ff3e00",
  "Node.js": "#339933",
  "Python": "#3776ab",
  "Rust": "#dea584",
  "Go": "#00add8",
  "Ruby": "#cc342d",
  "Java": "#ed8b00",
  "Kotlin": "#7f52ff",
  "Swift": "#f05138",
  "C++": "#00599c",
  "C#": "#512bd4",
  "PHP": "#777bb4",
  "Tailwind CSS": "#06b6d4",
  "CSS": "#1572b6",
  "Sass": "#cc6699",
  "SQL": "#336791",
  "PostgreSQL": "#4169e1",
  "Supabase": "#3ecf8e",
  "Firebase": "#ffca28",
  "Docker": "#2496ed",
  "GraphQL": "#e10098",
  "Prisma": "#2d3748",
  "Redis": "#dc382d",
  "MongoDB": "#47a248",
  "AWS": "#ff9900",
  "Vite": "#646cff",
  "Nuxt": "#00dc82",
};

export function getTechColor(tech: string): string {
  // Try exact match first, then case-insensitive
  if (TECH_COLORS[tech]) return TECH_COLORS[tech];
  const lower = tech.toLowerCase();
  for (const [key, color] of Object.entries(TECH_COLORS)) {
    if (key.toLowerCase() === lower) return color;
  }
  // Default color
  return "#8b5cf6";
}
