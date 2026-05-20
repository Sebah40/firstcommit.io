<div align="center">

# First Commit

### Publish your projects directly from your AI agent — via MCP.

<p align="center">
  <em>Where developers turn their Claude / Cursor / Codex sessions into stories the world can read.</em>
</p>

<p align="center">
  <a href="https://firstcommit.io"><img alt="Live" src="https://img.shields.io/badge/Live-firstcommit.io-c4a7e7?style=for-the-badge&logo=vercel&logoColor=white"></a>
  <a href="https://github.com/Sebah40/firstcommit.io"><img alt="License" src="https://img.shields.io/badge/License-Open_Source-eb6f92?style=for-the-badge"></a>
  <a href="https://firstcommit.io/api/mcp"><img alt="MCP" src="https://img.shields.io/badge/MCP-Native-9ccfd8?style=for-the-badge"></a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React_19-61dafb?style=flat-square&logo=react&logoColor=black">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white">
  <img alt="Anthropic" src="https://img.shields.io/badge/Claude_API-d97757?style=flat-square&logo=anthropic&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind_v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white">
</p>

<p align="center">
  <a href="https://firstcommit.io"><b>Website</b></a> ·
  <a href="#-quick-start-for-developers"><b>Get started</b></a> ·
  <a href="#-how-it-works"><b>How it works</b></a> ·
  <a href="#-local-development"><b>Contribute</b></a>
</p>

</div>

---

## What is this?

**First Commit is a publishing platform built around the Model Context Protocol (MCP).** It lets developers publish project stories — what they built, how they built it, what broke, what they learned — *directly from their AI coding agent*, without ever leaving the terminal.

Five thousand messages with Claude Code? That's a story. First Commit turns it into a public post, automatically structured into stages, key decisions, and problems hit.

It's also a **résumé platform**: every fellow gets a public profile and an auto-generated PDF résumé that pulls from their published projects.

---

## ✦ Quick start (for developers)

Add First Commit to your AI coding agent in one command:

```bash
claude mcp add --transport http firstcommit https://firstcommit.io/api/mcp
```

Then in your terminal, after building something with Claude:

```
publish this project to first commit
```

That's it. Claude calls the MCP tool, structures your session into a story, and ships it. Your post lives at `firstcommit.io/guide/<id>/<slug>`.

> Also works with **Cursor**, **Codex**, and any other MCP-compatible client.

---

## ✦ How it works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Your Terminal (Claude Code / Cursor / Codex)               │
│                                                             │
│        │                                                    │
│        │  publish, edit, read, search guides                │
│        ▼                                                    │
│                                                             │
│  First Commit MCP Server  (firstcommit.io/api/mcp)          │
│                                                             │
│        │                                                    │
│        │  OAuth 2.0 / PKCE                                  │
│        ▼                                                    │
│                                                             │
│  Supabase (Postgres) ── Next.js 16 web app ── Public posts  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Eight MCP tools are exposed:

| Tool | What it does |
|---|---|
| `firstcommit_publish` | Turn an agent session into a public guide |
| `firstcommit_read` | Fetch a guide by ID |
| `firstcommit_search` | Search the public catalog |
| `firstcommit_build` | Get a guide's full build approach to replicate |
| `firstcommit_edit` | Update one of your own posts |
| `firstcommit_delete` | Soft-delete one of your posts |
| `firstcommit_read_resume` | Read your résumé + published guides |
| `firstcommit_update_resume` | Push résumé updates and generate the PDF |

---

## ✦ Stack

<table>
<tr>
<td>

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion

</td>
<td>

**Backend**
- Supabase (Postgres + Auth + Storage)
- Next.js API routes
- Server actions
- `mcp-handler` for MCP server
- `@react-pdf/renderer` for résumé PDFs

</td>
<td>

**AI & Auth**
- Anthropic Claude API
- Model Context Protocol (MCP)
- OAuth 2.0 / PKCE
- JWT auth (`jose`)

</td>
</tr>
</table>

---

## ✦ Local development

```bash
# 1. Clone
git clone https://github.com/Sebah40/firstcommit.io.git
cd firstcommit.io

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#         SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL

# 4. Push migrations
SUPABASE_DB_PASSWORD=<yours> npx supabase db push

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Repository layout

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login / register
│   ├── api/[transport]/    # MCP HTTP transport endpoint
│   ├── api/cron/           # Scheduled jobs
│   ├── category/[slug]/    # Category browsing
│   ├── create/             # Manual guide creation
│   ├── guide/[guideId]/    # Public guide detail
│   ├── profile/[username]/ # Public profile + résumé
│   └── resume/[username]/  # Public résumé page
├── components/             # React components by feature
├── hooks/                  # useAuth, useGuideBuilder
├── lib/
│   ├── supabase/           # Clients + queries
│   ├── parser/             # Claude Code JSONL parser
│   └── resume/             # PDF generation
├── types/                  # TypeScript types
└── middleware.ts           # Auth session refresh
```

---

## ✦ Contributing

PRs welcome. The project is small and the codebase is approachable — most components are single-file, types are explicit, and the database schema lives in `supabase/migrations/`.

Open an issue first if you want to discuss a larger change.

---

## ✦ Author

Built by **[Sebastián Haoys](https://firstcommit.io/profile/sebah40)** ([@sebah40](https://github.com/Sebah40)).

[`firstcommit.io`](https://firstcommit.io) · [`linkedin`](https://linkedin.com/in/sebastian-haoys) · [`résumé`](https://firstcommit.io/resume/sebah40)

<div align="center">
<sub>Built in public from Concordia, Argentina.</sub>
</div>
