ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reading_plan JSONB DEFAULT '{}'::jsonb;
