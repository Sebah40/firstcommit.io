# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server**: `npm run dev` (starts on http://localhost:3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Production server**: `npm run start`

## Architecture

This is a Next.js 16 application (App Router) with Supabase for auth and database. It's a guide-building platform where users create step-by-step guides from Claude Code conversation exports.

### Directory Structure

```
src/
├── app/                    # App Router pages
│   ├── (auth)/            # Route group for login/register
│   ├── category/[slug]/   # Category browsing
│   ├── create/            # Guide creation
│   ├── guide/[guideId]/[slug]/  # Guide detail view
│   └── profile/[username]/      # User profiles
├── components/            # React components organized by feature
├── hooks/                 # Custom hooks (useAuth, useGuideBuilder)
├── lib/
│   ├── supabase/         # Supabase clients and queries
│   │   ├── client.ts     # Browser client (singleton)
│   │   ├── server.ts     # Server client (cookie-based)
│   │   ├── auth.ts       # Server actions: signUp, signIn, signOut
│   │   └── queries/      # Database query functions
│   ├── parser/           # Claude Code JSONL parser
│   └── utils.ts          # cn(), formatNumber(), slugify(), etc.
├── types/
│   ├── database.ts       # Auto-generated Supabase types
│   └── index.ts          # Application types
└── middleware.ts         # Auth session refresh
```

### Key Patterns

**Data Access**: Direct Supabase client queries from components (no REST API routes). Auth operations use server actions in `lib/supabase/auth.ts`.

**State Management**:
- `useAuth` hook wraps Supabase auth subscription with profile loading
- `useGuideBuilder` uses useReducer for complex guide creation form state

**Styling**: Tailwind CSS v4 with CSS variables for theming. Use `cn()` from `lib/utils.ts` for conditional class merging.

**Path Alias**: `@/*` maps to `./src/*`

### Database Tables

Core tables: `posts` (guides), `profiles`, `categories`, `guide_steps`, `guide_blocks`, `chat_messages`, `comments`, `post_likes`, `post_saves`, `follows`, `post_media`, `timeline_chapters`, `message_annotations`, `message_stars`

Storage bucket: `post-media` with pattern `{userId}/{postId}/{mediaIndex}.{ext}`

### Claude Code Integration

The app parses Claude Code JSONL exports via `lib/parser/claude-code.ts`. The `parseClaudeCodeJsonl()` function extracts conversation messages and tool actions (file creates/writes) for display as interactive timelines.
