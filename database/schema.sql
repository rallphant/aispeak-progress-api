-- SQL schema for the Aispeak User Progress Tracking API

-- Drop table if it exists (optional, for clean re-runs during development)
-- DROP TABLE IF EXISTS public.user_progress;
-- DROP FUNCTION IF EXISTS public.moddatetime();

-- Create the user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY NOT NULL,
    current_level INT NOT NULL DEFAULT 1,
    level_xp INT NOT NULL DEFAULT 0,
    total_xp INT NOT NULL DEFAULT 0,
    streak_days INT NOT NULL DEFAULT 0,
    lessons_completed_today INT NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE -- If a user is deleted from auth.users, their progress is also deleted.
);

COMMENT ON TABLE public.user_progress IS 'Stores user learning progress for Aispeak, including levels, XP, streaks, and activity timestamps.';

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call moddatetime function before any update on user_progress table
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.moddatetime();

-- Note: Ensure appropriate grants if your Supabase setup requires them,
-- though default Supabase roles (anon, authenticated, service_role) usually have necessary schema privileges.
-- Example: GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_progress TO authenticated;
-- RLS policies will further control access for the 'authenticated' role.