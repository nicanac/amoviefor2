# 🎬 amoviefor2
> A mobile-first web app for couples to find the perfect movie to watch tonight.

## Not Another Endless scroll
Stop spending 45 minutes scrolling through Netflix. **amoviefor2** streamlines the decision process:
1. **Couple Up**: Share a 6-character code with your partner.
2. **Quiz**: Answer 5 quick questions about your mood (Vibe, Era, Rating, Language, Genre).
3. **Match**: Get instant, tailored recommendations that fit BOTH your tastes.
4. **Watch**: Pick a movie and enjoy.

**Note:** The swiping phase has been removed in favor of a direct "Best Matches" list to get you to your movie faster.

---

## 🛠️ Tech Stack
Built with the **B.L.A.S.T.** protocol and **A.N.T.** architecture.

- **Framework**: [Next.js 16.1](https://nextjs.org/) (App Router, Server Actions)
- **Database**: [Supabase](https://supabase.com/) (Postgres, Auth, Realtime, RLS)
- **Movie Data**: [TMDB API](https://www.themoviedb.org/documentation/api)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/)

## 🚀 Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/nicanac/amoviefor2.git
   cd amoviefor2
   npm install
   ```

2. **Environment Setup**
   Copy `.env.local.example` to `.env.local` and add your keys:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   TMDB_API_KEY=...
   TMDB_ACCESS_TOKEN=... (optional)
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure (A.N.T.)

- **Layer 1: Architecture** (`.vibe/`) - SOPs, schemas, logs.
- **Layer 2: Navigation** (`app/`, `actions/`) - Routes and server logic.
- **Layer 3: Tools** (`tools/`, `lib/`) - Atomic utilities and scripts.

## 🤝 Contributing
1. Create a feature branch (`feat/amazing-feature`).
2. Commit changes using conventional commits (`feat: add amazing feature`).
3. Push to branch and open a PR.

---
*Created by [Antigravity](https://github.com/google-deepmind/antigravity)*
