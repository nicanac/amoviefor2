# 📜 NEXUS — Project Constitution
## Project: amoviefor2
### Last Updated: 2026-02-09

---

## 1. North Star
> **Help couples find a movie they'll both enjoy in under 60 seconds.**
>
> Each partner answers 5–10 quick preference questions. The system builds a personalized movie list (≥ 3 films, ranked by match score). Both partners then swipe; mutual "yes" = movie night decided.

---

## 2. Tech Stack

| Layer        | Technology         | Role                                    |
|--------------|--------------------|-----------------------------------------|
| Framework    | Next.js 16.1       | App Router, Server Components, Actions  |
| Database     | Supabase (Postgres) | Source of Truth, Auth, Realtime, RLS   |
| Movie Data   | TMDB API           | Movie search, metadata, posters         |
| Deployment   | Vercel             | Hosting, Edge Functions, CI/CD          |
| Repository   | GitHub             | Source control, CI triggers             |
| Design       | Mobile-First       | Primary target: smartphones             |

---

## 3. Data Schemas

### 3.1 `profiles`
> Extends Supabase `auth.users`. Created automatically via trigger on signup.

```json
{
  "id": "uuid (FK → auth.users.id, PK)",
  "username": "string (unique, min 3 chars)",
  "full_name": "string",
  "avatar_url": "string | null",
  "partner_code": "string (unique, 6-char invite code)",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### 3.2 `couples`
> Links two users. A user can belong to only ONE active couple.

```json
{
  "id": "uuid (PK)",
  "user1_id": "uuid (FK → profiles.id)",
  "user2_id": "uuid (FK → profiles.id)",
  "status": "enum('pending', 'active', 'dissolved')",
  "created_at": "timestamptz"
}
```
**Invariant:** `user1_id ≠ user2_id`. One active couple per user.

### 3.3 `questions`
> Static question bank. Seeded at deploy time.

```json
{
  "id": "int (PK)",
  "text": "string (the question displayed to user)",
  "type": "enum('single_choice', 'multi_choice', 'slider')",
  "options": "jsonb (array of possible answers)",
  "category": "enum('genre', 'mood', 'era', 'length', 'language', 'rating')",
  "weight": "float (influence on scoring algorithm)",
  "order": "int (display order)"
}
```

### 3.4 `sessions`
> A movie-finding session for a couple. One active session at a time.

```json
{
  "id": "uuid (PK)",
  "couple_id": "uuid (FK → couples.id)",
  "status": "enum('answering', 'matching', 'swiping', 'completed', 'expired')",
  "created_at": "timestamptz",
  "expires_at": "timestamptz"
}
```

### 3.5 `user_answers`
> Each user's answers within a session.

```json
{
  "id": "uuid (PK)",
  "session_id": "uuid (FK → sessions.id)",
  "user_id": "uuid (FK → profiles.id)",
  "question_id": "int (FK → questions.id)",
  "answer": "jsonb (selected option(s) or value)",
  "answered_at": "timestamptz"
}
```
**Invariant:** One answer per user per question per session. Composite unique on `(session_id, user_id, question_id)`.

### 3.6 `session_movies`
> Movies recommended for a session, computed after BOTH users answer.

```json
{
  "id": "uuid (PK)",
  "session_id": "uuid (FK → sessions.id)",
  "tmdb_id": "int (TMDB movie ID)",
  "title": "string",
  "poster_path": "string",
  "overview": "string",
  "release_year": "int",
  "genres": "jsonb (array of genre strings)",
  "vote_average": "float",
  "match_score": "float (0.0–1.0, computed relevance)",
  "rank": "int (display order, 1 = best match)",
  "created_at": "timestamptz"
}
```
**Invariant:** Minimum 3 movies per session. Ordered by `match_score DESC`.

### 3.7 `swipes`
> Individual swipe actions during the swiping phase.

```json
{
  "id": "uuid (PK)",
  "session_id": "uuid (FK → sessions.id)",
  "user_id": "uuid (FK → profiles.id)",
  "session_movie_id": "uuid (FK → session_movies.id)",
  "direction": "enum('right', 'left')",
  "swiped_at": "timestamptz"
}
```
**Invariant:** One swipe per user per movie per session. Composite unique on `(session_id, user_id, session_movie_id)`.

### 3.8 `matches`
> Created automatically when BOTH users swipe right on the same movie.

```json
{
  "id": "uuid (PK)",
  "session_id": "uuid (FK → sessions.id)",
  "session_movie_id": "uuid (FK → session_movies.id)",
  "matched_at": "timestamptz"
}
```
**Invariant:** A match exists IFF both users in the couple swiped `right` on the same `session_movie_id`.

### 3.9 `seen_movies`
> Movies a user has already watched. Excluded from future recommendations.

```json
{
  "id": "uuid (PK)",
  "user_id": "uuid (FK → profiles.id)",
  "tmdb_id": "int (TMDB movie ID)",
  "source": "enum('auto', 'manual')",
  "marked_at": "timestamptz"
}
```
**Invariant:** Composite unique on `(user_id, tmdb_id)`. `auto` = added after a matched movie is watched. `manual` = user marked it during a session.

---

## 4. Behavioral Rules (Invariants)

### MUST ALWAYS:
- [x] Require BOTH users to finish answering before generating movie list
- [x] Show at least 3 movie propositions, ordered by `match_score DESC`
- [x] Create a `match` record ONLY when both users swipe right
- [x] Exclude ALL movies in `seen_movies` for EITHER user from recommendations
- [x] Allow users to mark movies as "already seen" during the swipe phase
- [x] Enforce RLS on all tables — users can only access their own couple's data
- [x] Use Supabase Realtime to notify partner when answers complete / swipe happens

### MUST NEVER:
- [x] Recommend a movie already in `seen_movies` for either partner
- [x] Allow a user to be in multiple active couples simultaneously
- [x] Allow a user to swipe on a movie before both users have answered
- [x] Expose one user's swipe choices to their partner before both have swiped
- [x] Allow sessions to persist indefinitely (expire after 24h)

---

## 5. Integrations

| Service       | Role                          | Auth Method       | Status     |
|---------------|-------------------------------|-------------------|------------|
| Supabase Auth | User signup/login             | Email + OAuth     | ⏳ Pending |
| Supabase DB   | Source of Truth (Postgres)    | Service Role Key  | ⏳ Pending |
| Supabase RT   | Realtime swipe notifications  | Anon Key + RLS    | ⏳ Pending |
| TMDB API      | Movie search & metadata       | API Key (v3)      | ⏳ Pending |
| Vercel        | Hosting & Edge                | GitHub Integration | ⏳ Pending |

---

## 6. Source of Truth

| Entity         | Source of Truth    | Notes                                     |
|----------------|--------------------|--------------------------------------------|
| Users          | Supabase Auth      | `profiles` extends `auth.users`            |
| Couples        | Supabase DB        | `couples` table                            |
| Questions      | Supabase DB        | Seeded, rarely changes                     |
| Answers        | Supabase DB        | Per-session, per-user                      |
| Movie Metadata | TMDB API           | Fetched live, cached in `session_movies`   |
| Swipes         | Supabase DB        | Immutable after creation                   |
| Matches        | Supabase DB        | Computed from swipes                       |
| Seen Movies    | Supabase DB        | User-managed + auto-added                  |

---

## 7. Glossary

| Term            | Definition                                                       |
|-----------------|------------------------------------------------------------------|
| Couple          | Two users linked together for movie matching                     |
| Session         | A single movie-finding round for a couple                        |
| Partner Code    | 6-character invite code to form a couple                         |
| Match Score     | 0.0–1.0 float indicating how well a movie fits both users' prefs |
| Swipe Right     | User wants to watch this movie                                   |
| Swipe Left      | User passes on this movie                                        |
| Match           | Both users swiped right on the same movie                        |
| Seen Movie      | A movie marked as already watched, excluded from recommendations |
