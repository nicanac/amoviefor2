# 🏛️ ARCHITECTURE — Technical SOPs & Logic Maps
## Project: amoviefor2
### Last Updated: 2026-02-09

---

## A.N.T. 3-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│            LAYER 1: ARCHITECTURE (SOPs)          │
│         Markdown rules. Update BEFORE code.      │
│  .vibe/nexus.md  ·  .vibe/architecture.md        │
└──────────────────────┬──────────────────────────┘
                       │ reads rules
┌──────────────────────▼──────────────────────────┐
│           LAYER 2: NAVIGATION (Routing)          │
│      Server Components · Server Actions · API    │
│  app/  ·  actions/  ·  lib/  ·  middleware.ts    │
└──────────────────────┬──────────────────────────┘
                       │ calls tools
┌──────────────────────▼──────────────────────────┐
│             LAYER 3: TOOLS (Scripts)             │
│     Atomic, testable, deterministic functions    │
│  tools/  ·  lib/tmdb.ts  ·  lib/scoring.ts      │
└─────────────────────────────────────────────────┘
```

---

## Folder Structure

```
amoviefor2/
├── .vibe/                      # Workspace memory (never deployed)
│   ├── nexus.md                # Project constitution
│   ├── task_plan.md            # Active roadmap
│   ├── logbook.json            # Audit trail
│   └── architecture.md         # This file
├── app/                        # Next.js 16.1 App Router
│   ├── layout.tsx              # Root layout (mobile-first meta)
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind + custom styles
│   ├── (auth)/                 # Auth route group
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/            # Authenticated route group
│   │   ├── layout.tsx          # Auth check wrapper
│   │   ├── dashboard/page.tsx  # Home: couple status, start session
│   │   ├── invite/page.tsx     # Join couple via partner code
│   │   ├── session/
│   │   │   ├── questions/page.tsx  # Question flow
│   │   │   ├── waiting/page.tsx    # Wait for partner
│   │   │   ├── swipe/page.tsx      # Swipe interface
│   │   │   └── match/page.tsx      # Match celebration
│   │   └── history/page.tsx    # Past matches & seen movies
│   └── api/                    # API routes (if needed)
│       └── tmdb/route.ts       # TMDB proxy (hides API key)
├── actions/                    # Server Actions
│   ├── auth.ts
│   ├── couple.ts
│   ├── session.ts
│   ├── swipe.ts
│   └── movies.ts
├── components/                 # Shared UI components
│   ├── ui/                     # Primitives (Button, Card, Input)
│   ├── swipe-card.tsx          # Movie swipe card with gestures
│   ├── question-card.tsx       # Question display component
│   ├── movie-poster.tsx        # TMDB poster with fallback
│   └── match-celebration.tsx   # Match animation overlay
├── lib/                        # Shared utilities
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client
│   │   └── middleware.ts       # Auth middleware helper
│   ├── tmdb.ts                 # TMDB API client
│   ├── scoring.ts              # Match score algorithm
│   └── utils.ts                # Generic helpers
├── tools/                      # Layer 3: Verification & scripts
│   ├── verify-supabase.ts      # Handshake test
│   ├── verify-tmdb.ts          # Handshake test
│   └── seed-questions.ts       # Seed question bank
├── types/                      # TypeScript type definitions
│   ├── database.ts             # Supabase generated types
│   ├── tmdb.ts                 # TMDB API types
│   └── domain.ts               # App-level enums & types
├── supabase/
│   └── migrations/             # SQL migrations
│       ├── 001_profiles.sql
│       ├── 002_couples.sql
│       ├── 003_questions.sql
│       ├── 004_sessions.sql
│       ├── 005_user_answers.sql
│       ├── 006_session_movies.sql
│       ├── 007_swipes.sql
│       ├── 008_matches.sql
│       └── 009_seen_movies.sql
├── public/                     # Static assets
├── .env.local                  # Secrets (never committed)
├── middleware.ts                # Next.js middleware (auth guard)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Layer 1: SOPs (Standard Operating Procedures)

### SOP-001: Couple Formation
```
TRIGGER: User clicks "Invite Partner" or "Join Partner"
FLOW:
  1. CREATE couple → User gets a unique 6-char partner_code
  2. Partner enters code → System validates code exists & couple is 'pending'
  3. System sets couple.status = 'active', couple.user2_id = partner
GUARDS:
  - User must NOT already be in an active couple
  - Partner code must exist and couple must be 'pending'
  - Cannot couple with yourself
ROLLBACK:
  - If partner code invalid → show error, no state change
```

### SOP-002: Question Flow
```
TRIGGER: Either user in an active couple starts a new session
FLOW:
  1. CREATE session (status: 'answering')
  2. FETCH questions (ordered by `order` field, 5–10 questions)
  3. User answers each question → INSERT into user_answers
  4. When user completes all questions → check if partner also done
     a. If YES → transition to SOP-003 (Matching)
     b. If NO → show waiting screen, subscribe to Realtime
GUARDS:
  - Session must be 'answering' status
  - Cannot answer same question twice (upsert)
  - Both users must answer ALL questions before proceeding
REALTIME:
  - On answer insert → notify partner of progress (X/N complete)
```

### SOP-003: Matching Engine
```
TRIGGER: Both users have completed all questions in a session
FLOW:
  1. SET session.status = 'matching'
  2. COMPUTE combined preference profile from both users' answers
  3. QUERY TMDB API with computed filters:
     - Genres (intersection of both users' genre preferences)
     - Era (year range from era preferences)
     - Rating (minimum vote_average)
     - Language (preferred languages)
  4. SCORE each movie against combined profile → match_score (0.0–1.0)
  5. FILTER OUT movies in seen_movies for EITHER user
  6. SELECT top N movies (minimum 3), INSERT into session_movies
  7. SET session.status = 'swiping'
GUARDS:
  - Must have ≥ 3 movies after filtering. If not, relax filters and retry.
  - All seen_movies for both users must be excluded.
FALLBACK:
  - If TMDB returns < 3 results → broaden genre filter → retry once
  - If still < 3 → include popular movies as filler, flag as "wildcard"
```

### SOP-004: Swipe Session
```
TRIGGER: Session status becomes 'swiping'
FLOW:
  1. FETCH session_movies ordered by rank
  2. Display movies as swipeable cards (mobile touch gestures)
  3. User swipes right (want) or left (pass)
  4. INSERT swipe record
  5. User can tap "Already Seen" → INSERT into seen_movies (source: manual)
     → REMOVE movie from their swipe deck
  6. After each right-swipe → CHECK if partner also swiped right
     a. If YES → CREATE match → SOP-005
     b. If NO → continue swiping
  7. When user finishes all cards → show "Waiting for partner" if no match yet
GUARDS:
  - Cannot see partner's swipes until both done or match found
  - One swipe per movie per user (idempotent)
REALTIME:
  - Subscribe to matches table → instant match notification
```

### SOP-005: Match & Result
```
TRIGGER: Both users swiped right on the same movie
FLOW:
  1. INSERT into matches table
  2. SET session.status = 'completed'
  3. NOTIFY both users via Realtime
  4. Display celebration animation with movie details
  5. Option: "Mark as Watched" → INSERT into seen_movies (source: auto)
  6. Option: "Start New Session" → back to SOP-002
GUARDS:
  - Match requires BOTH users swiped right (verified server-side)
  - If multiple matches in same session → show all, user picks one
```

---

## Layer 2: Navigation (Routing Logic)

### Route Protection
```
middleware.ts:
  IF no session → redirect to /login
  IF no couple → redirect to /dashboard (with "invite partner" prompt)
  IF active session → redirect to appropriate session step
```

### Session State Machine
```
              ┌──────────┐
              │  CREATE   │
              └─────┬─────┘
                    ▼
            ┌──────────────┐
         ┌──│  ANSWERING   │──┐
         │  └──────────────┘  │
    user1 done            user2 done
         │  ┌──────────────┐  │
         └─▶│   MATCHING   │◀─┘
            └──────┬───────┘
                   ▼
            ┌──────────────┐
            │   SWIPING    │
            └──────┬───────┘
                   ▼
         ┌─────────────────┐
         │ match found?    │
         │  YES → COMPLETED│
         │  NO  → EXPIRED  │ (after 24h)
         └─────────────────┘
```

### Realtime Subscriptions
```
Channel: session:{session_id}
Events:
  - user_answers:INSERT   → update partner's progress bar
  - session:UPDATE        → transition UI to next phase
  - matches:INSERT        → trigger celebration overlay
```

---

## Layer 3: Tools (Deterministic Scripts)

| Tool                    | File                  | Input                         | Output                    | Atomic? |
|-------------------------|-----------------------|-------------------------------|---------------------------|---------|
| Verify Supabase         | tools/verify-supabase | env vars                      | connection OK/FAIL        | ✅      |
| Verify TMDB             | tools/verify-tmdb     | env vars                      | API key valid OK/FAIL     | ✅      |
| Seed Questions          | tools/seed-questions  | questions JSON                | DB seeded                 | ✅      |
| Score Movies            | lib/scoring.ts        | user1_answers, user2_answers  | scored movie list         | ✅      |
| TMDB Search             | lib/tmdb.ts           | filters (genre, year, etc.)   | movie array               | ✅      |
| Generate Partner Code   | lib/utils.ts          | none                          | 6-char unique string      | ✅      |

---

## Self-Annealing Protocol

```
ON ERROR:
  1. Capture full error trace (message, stack, context)
  2. Log to logbook.json with phase, action, trace
  3. Diagnose: Is it a data issue, API issue, or logic issue?
  4. Patch the failing tool (Layer 3)
  5. Update the relevant SOP (Layer 1) with new guard/fallback
  6. Re-run to verify fix
  7. Log resolution in logbook.json
```

---

## Scoring Algorithm (SOP-003 Detail)

```
FUNCTION computeMatchScore(movie, user1Answers, user2Answers):

  weights = { genre: 0.35, mood: 0.20, era: 0.15, length: 0.10, language: 0.10, rating: 0.10 }
  score = 0.0

  FOR EACH category IN weights:
    user1Pref = extractPreference(user1Answers, category)
    user2Pref = extractPreference(user2Answers, category)
    movieValue = extractMovieAttribute(movie, category)

    // Intersection scoring: higher if movie satisfies BOTH users
    user1Match = similarity(user1Pref, movieValue)  // 0.0–1.0
    user2Match = similarity(user2Pref, movieValue)  // 0.0–1.0

    // Use geometric mean to penalize one-sided matches
    categoryScore = sqrt(user1Match * user2Match)
    score += categoryScore * weights[category]

  RETURN clamp(score, 0.0, 1.0)
```

> The geometric mean ensures a movie must appeal to BOTH users, not just one strongly.
