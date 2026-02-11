# 🗺️ TASK PLAN — Active Roadmap
## Project: amoviefor2
### Last Updated: 2026-02-11
...
- [x] Bug Fix: Session Handshake & RLS Policy for Partner Answers (Fixed via Admin Client)

### High Priority
- [ ] Implement Supabase Realtime subscriptions for partner notifications
...
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

## Phase 1: Blueprint (Logic First) ✅
### 1A — Project Scaffolding
- [x] Initialize Next.js 16.1 project with TypeScript
- [x] Configure Tailwind CSS (mobile-first)
- [x] Set up ESLint + Prettier
- [x] Create folder structure (A.N.T. layers)
- [x] Configure path aliases (`@/`)

### 1B — Supabase Setup
- [x] Create Supabase project
- [x] Write SQL migration: `profiles` table + trigger
- [x] Write SQL migration: `couples` table
- [x] Write SQL migration: `questions` table + seed data
- [x] Write SQL migration: `sessions` table
- [x] Write SQL migration: `user_answers` table
- [x] Write SQL migration: `session_movies` table
- [x] Write SQL migration: `swipes` table
- [x] Write SQL migration: `matches` table
- [x] Write SQL migration: `seen_movies` table
- [x] Write RLS policies for all tables
- [x] Set up Realtime publications

### 1C — Type Definitions
- [x] Generate TypeScript types from Supabase schema (`types/database.ts`)
- [x] Define TMDB API response types (`types/tmdb.ts`)
- [x] Define app-level domain types (`types/domain.ts`)

---

## Phase 2: Link (Connectivity) ✅
### 2A — Environment & Auth
- [x] Configure `.env.local` with Supabase keys
- [x] Configure `.env.local` with TMDB API key
- [x] Set up Supabase client (browser + server) (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] Build `tools/verify-supabase.ts` handshake script
- [ ] Build `tools/verify-tmdb.ts` handshake script
- [x] Build `tools/verify-env.ts` environment guard
- [x] Implement Supabase Auth (signup/login/logout) (`actions/auth.ts`)
- [x] Create auth middleware for protected routes (`middleware.ts`)

### 2B — TMDB Integration
- [x] Build TMDB API client (`lib/tmdb.ts`)
- [x] Implement movie search by genre/keyword
- [x] Implement movie discovery with filters (era, rating, language)
- [x] Implement movie detail fetch
- [x] Add response caching layer
- [x] Create TMDB proxy route (`app/api/tmdb/route.ts`)

---

## Phase 3: Architect (3-Layer Build) ✅
### 3A — Core Flows
- [x] **Couple Formation:** Create/join couple via partner code (`components/invite-client.tsx`, `actions/couple.ts`)
- [x] **Question Flow:** Display questions, collect answers, track progress (`components/quiz-client.tsx`, `actions/session.ts`)
- [x] **Matching Engine:** Score algorithm (answers → TMDB query → ranked list) (`lib/scoring.ts`)
- [x] **Swipe Session:** Tinder-style card swiping with animations (`components/swipe-client.tsx`, `actions/swipe.ts`) **(DISABLED)**
- [x] **Match Detection:** Realtime match detection + celebration UI (`components/match-result-client.tsx`)
- [x] **Seen Movies:** Mark as seen, exclude from future sessions (`actions/movies.ts`, `components/history-client.tsx`)

### 3B — Pages & Routes
- [x] `/` — Landing page (mobile-first hero)
- [x] `/login` — Auth page (sign up / sign in)
- [x] `/dashboard` — Home (couple status, start session)
- [x] `/invite` — Join couple via partner code
- [x] `/session/questions` — Question answering flow
- [x] `/session/waiting` — Waiting for partner to finish
- [x] `/session/waiting` — Waiting for partner to finish
- [x] `/session/swipe` — Swipe interface **(DISABLED)**
- [x] `/session/match` — Match result celebration
- [x] `/history` — Past matches & seen movies

### 3C — Server Actions
- [x] `actions/auth.ts` — signup, login, logout
- [x] `actions/couple.ts` — create, join, dissolve
- [x] `actions/session.ts` — create, submit answers, get movies
- [x] `actions/swipe.ts` — record swipe, check match **(DISABLED)**
- [x] `actions/movies.ts` — mark seen, get history

---

## Phase 4: Stylize (UX & Refinement) 🔲
- [x] Tailwind CSS configuration with mobile-first approach
- [x] Core client components with quiz, swipe, match, invite, dashboard, history
- [x] Session layout with nested routing
- [ ] Design system: colors, typography, spacing (shadcn/ui integration?)
- [ ] Swipe card component with touch gestures + animations **(DISABLED)**
- [ ] Loading states & skeleton screens
- [ ] Empty states & error boundaries
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] PWA manifest + service worker
- [ ] Celebration animation on match (improve `match-result-client.tsx`)
- [x] Realtime subscription implementation (Supabase Realtime)

---

## Phase 5: Trigger (Deployment) ✅
- [x] Connect GitHub repo to Vercel
- [x] Configure Vercel environment variables
- [x] Set up preview deployments on PR
- [ ] Configure session expiry cron job
- [x] Final smoke test on production
- [x] Write maintenance runbook in `logbook.json`

---

## Remaining Tasks (Priority)

### 🚨 New Requests (from Audio)
- [x] **Profile Badge:** Display Avatar + Name in dashboard header.
- [x] **Logout Layout:** Position Logout button next to Profile Badge.
- [x] **Profile Page:** Create `/profile` page; link badge to it.
- [x] **Friend List:** Query past couples to show "Recent Partners".
- [x] **Quick Switch:** Allow selecting a Friend to form a couple (bypass code).

### High Priority
- [x] Implement Supabase Realtime subscriptions for partner notifications
- [x] Create `tools/verify-env.ts` environment guard
- [x] Create `lib/logger.ts` Self-Annealing logger
- [x] Add Zod validation to all Server Actions (`lib/validations.ts`)
- [ ] Create `tools/verify-supabase.ts` handshake script
- [ ] Create `tools/verify-tmdb.ts` handshake script
- [ ] Implement `tools/seed-questions.ts` script
- [ ] Configure session expiry cron job

### Medium Priority
- [ ] Improve swipe card gestures + animations **(DISABLED)**
- [ ] Add loading states & skeleton screens
- [ ] Add empty states & error boundaries
- [ ] Implement design system (shadcn/ui primitives)
- [ ] Accessibility audit

### Completed Updates (Current Session)
- [x] Disable swiping and show results immediately after quiz
- [x] Add 'Clear Session' and 'Change Partner' buttons to match results
- [x] Refine Matching Logic: Remove 'language', force 'multi_choice', inclusivity fixes, weights adjusted
- [ ] PWA manifest + service worker
- [ ] Enhanced celebration animations
- [ ] Session expiry cleanup cron job verification

