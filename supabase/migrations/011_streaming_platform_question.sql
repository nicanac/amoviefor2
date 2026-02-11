-- =============================================================================
-- 011_streaming_platform_question.sql — Add streaming platform question
-- =============================================================================

-- Alter the category check constraint to include 'platform'
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_category_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_category_check
  CHECK (category IN ('genre', 'mood', 'era', 'length', 'language', 'rating', 'platform'));

-- Insert streaming platform question (multi-choice, order 7)
INSERT INTO public.questions (text, type, options, category, weight, "order") VALUES
(
  'Where do you want to watch?',
  'multi_choice',
  '[
    {"value": "netflix", "label": "Netflix", "emoji": "🔴", "provider_id": 8},
    {"value": "amazon", "label": "Amazon Prime", "emoji": "📦", "provider_id": 9},
    {"value": "disney", "label": "Disney+", "emoji": "🏰", "provider_id": 337},
    {"value": "appletv", "label": "Apple TV+", "emoji": "🍎", "provider_id": 350},
    {"value": "hbo", "label": "HBO Max", "emoji": "🟣", "provider_id": 384}
  ]'::jsonb,
  'platform', 0.0, 0
);
