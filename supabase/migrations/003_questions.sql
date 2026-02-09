-- =============================================================================
-- 003_questions.sql — Question bank + seed data
-- =============================================================================

create table public.questions (
  id serial primary key,
  text text not null,
  type text not null check (type in ('single_choice', 'multi_choice', 'slider')),
  options jsonb not null default '[]',
  category text not null check (category in ('genre', 'mood', 'era', 'length', 'language', 'rating')),
  weight real not null default 1.0,
  "order" int not null default 0
);

alter table public.questions enable row level security;

-- Questions are readable by everyone (public data)
create policy "Questions are viewable by everyone"
  on public.questions for select using (true);

-- Seed questions
insert into public.questions (text, type, options, category, weight, "order") values

-- Q1: Genre (multi-choice)
(
  'What genres do you enjoy?',
  'multi_choice',
  '[
    {"value": "action", "label": "Action", "emoji": "💥", "tmdb_genre_id": 28},
    {"value": "comedy", "label": "Comedy", "emoji": "😂", "tmdb_genre_id": 35},
    {"value": "drama", "label": "Drama", "emoji": "🎭", "tmdb_genre_id": 18},
    {"value": "horror", "label": "Horror", "emoji": "👻", "tmdb_genre_id": 27},
    {"value": "romance", "label": "Romance", "emoji": "❤️", "tmdb_genre_id": 10749},
    {"value": "scifi", "label": "Sci-Fi", "emoji": "🚀", "tmdb_genre_id": 878},
    {"value": "thriller", "label": "Thriller", "emoji": "😱", "tmdb_genre_id": 53},
    {"value": "animation", "label": "Animation", "emoji": "🎨", "tmdb_genre_id": 16}
  ]'::jsonb,
  'genre', 1.0, 1
),

-- Q2: Mood (single-choice)
(
  'What''s the vibe tonight?',
  'single_choice',
  '[
    {"value": "romantic", "label": "Romantic", "emoji": "❤️"},
    {"value": "thrilling", "label": "Thrilling", "emoji": "😱"},
    {"value": "funny", "label": "Funny", "emoji": "😂"},
    {"value": "epic", "label": "Epic", "emoji": "⚔️"},
    {"value": "dark", "label": "Dark", "emoji": "🌑"},
    {"value": "chill", "label": "Chill", "emoji": "😌"}
  ]'::jsonb,
  'mood', 1.0, 2
),

-- Q3: Era (single-choice)
(
  'Which era do you prefer?',
  'single_choice',
  '[
    {"value": "classic", "label": "Classic (50s-80s)", "emoji": "🎬"},
    {"value": "90s", "label": "90s", "emoji": "📼"},
    {"value": "2000s", "label": "2000s", "emoji": "💿"},
    {"value": "2010s", "label": "2010s", "emoji": "📱"},
    {"value": "recent", "label": "Recent (2020+)", "emoji": "🆕"},
    {"value": "any", "label": "Any era", "emoji": "🌐"}
  ]'::jsonb,
  'era', 1.0, 3
),

-- Q4: Length (single-choice)
(
  'How long should the movie be?',
  'single_choice',
  '[
    {"value": "short", "label": "Under 90 min", "emoji": "⚡"},
    {"value": "medium", "label": "90-120 min", "emoji": "⏱️"},
    {"value": "long", "label": "Over 2 hours", "emoji": "🍿"},
    {"value": "any", "label": "Doesn''t matter", "emoji": "🤷"}
  ]'::jsonb,
  'length', 1.0, 4
),

-- Q5: Language (single-choice)
(
  'Language preference?',
  'single_choice',
  '[
    {"value": "en", "label": "English", "emoji": "🇬🇧"},
    {"value": "fr", "label": "French", "emoji": "🇫🇷"},
    {"value": "es", "label": "Spanish", "emoji": "🇪🇸"},
    {"value": "ko", "label": "Korean", "emoji": "🇰🇷"},
    {"value": "ja", "label": "Japanese", "emoji": "🇯🇵"},
    {"value": "any", "label": "Any language", "emoji": "🌍"}
  ]'::jsonb,
  'language', 1.0, 5
),

-- Q6: Rating (slider)
(
  'Minimum rating you''d accept?',
  'slider',
  '[
    {"value": "5", "label": "5+ (anything goes)"},
    {"value": "6", "label": "6+ (decent)"},
    {"value": "7", "label": "7+ (good)"},
    {"value": "8", "label": "8+ (great only)"}
  ]'::jsonb,
  'rating', 1.0, 6
);
