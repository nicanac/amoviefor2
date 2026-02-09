# 🗺️ TASK PLAN — Active Roadmap
## Project: amoviefor2
### Last Updated: 2026-02-09

---

## Phase 0: Initialization ✅
- [x] Create `.vibe/nexus.md`
- [x] Create `.vibe/task_plan.md`
- [x] Create `.vibe/logbook.json`
- [x] Create `.vibe/architecture.md`
- [x] Complete 5 Discovery Questions
- [x] Define data schemas
- [x] Document behavioral invariants

---

## Phase 1: Blueprint (Logic First) 🔲
### 1A — Project Scaffolding
- [ ] Initialize Next.js 16.1 project with TypeScript
- [ ] Configure Tailwind CSS (mobile-first)
- [ ] Set up ESLint + Prettier
- [ ] Create folder structure (A.N.T. layers)
- [ ] Configure path aliases (`@/`)

### 1B — Supabase Setup
- [ ] Create Supabase project
- [ ] Write SQL migration: `profiles` table + trigger
- [ ] Write SQL migration: `couples` table
- [ ] Write SQL migration: `questions` table + seed data
- [ ] Write SQL migration: `sessions` table
- [ ] Write SQL migration: `user_answers` table
- [ ] Write SQL migration: `session_movies` table
- [ ] Write SQL migration: `swipes` table
- [ ] Write SQL migration: `matches` table
- [ ] Write SQL migration: `seen_movies` table
- [ ] Write RLS policies for all tables
- [ ] Set up Realtime publications

### 1C — Type Definitions
- [ ] Generate TypeScript types from Supabase schema
- [ ] Define TMDB API response types
- [ ] Define app-level domain types (enums, computed types)

---

## Phase 2: Link (Connectivity) 🔲
### 2A — Environment & Auth
- [ ] Configure `.env.local` with Supabase keys
- [ ] Configure `.env.local` with TMDB API key
- [ ] Set up Supabase client (browser + server)
- [ ] Build `tools/verify-supabase.ts` handshake script
- [ ] Build `tools/verify-tmdb.ts` handshake script
- [ ] Implement Supabase Auth (signup/login/logout)
- [ ] Create auth middleware for protected routes

### 2B — TMDB Integration
- [ ] Build TMDB API client (`lib/tmdb.ts`)
- [ ] Implement movie search by genre/keyword
- [ ] Implement movie discovery with filters (era, rating, language)
- [ ] Implement movie detail fetch
- [ ] Add response caching layer

---

## Phase 3: Architect (3-Layer Build) 🔲
### 3A — Core Flows
- [ ] **Couple Formation:** Create/join couple via partner code
- [ ] **Question Flow:** Display questions, collect answers, track progress
- [ ] **Matching Engine:** Score algorithm (answers → TMDB query → ranked list)
- [ ] **Swipe Session:** Tinder-style card swiping with animations
- [ ] **Match Detection:** Realtime match detection + celebration UI
- [ ] **Seen Movies:** Mark as seen, exclude from future sessions

### 3B — Pages & Routes
- [ ] `/` — Landing page (mobile-first hero)
- [ ] `/login` — Auth page (sign up / sign in)
- [ ] `/dashboard` — Home (couple status, start session)
- [ ] `/invite` — Join couple via partner code
- [ ] `/session/questions` — Question answering flow
- [ ] `/session/waiting` — Waiting for partner to finish
- [ ] `/session/swipe` — Swipe interface
- [ ] `/session/match` — Match result celebration
- [ ] `/history` — Past matches & seen movies

### 3C — Server Actions
- [ ] `actions/auth.ts` — signup, login, logout
- [ ] `actions/couple.ts` — create, join, dissolve
- [ ] `actions/session.ts` — create, submit answers, get movies
- [ ] `actions/swipe.ts` — record swipe, check match
- [ ] `actions/movies.ts` — mark seen, get history

---

## Phase 4: Stylize (UX & Refinement) 🔲
- [ ] Design system: colors, typography, spacing (mobile-first)
- [ ] Swipe card component with touch gestures + animations
- [ ] Loading states & skeleton screens
- [ ] Empty states & error boundaries
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] PWA manifest + service worker
- [ ] Celebration animation on match

---

## Phase 5: Trigger (Deployment) 🔲
- [ ] Connect GitHub repo to Vercel
- [ ] Configure Vercel environment variables
- [ ] Set up preview deployments on PR
- [ ] Configure session expiry cron job
- [ ] Final smoke test on production
- [ ] Write maintenance runbook in `logbook.json`
