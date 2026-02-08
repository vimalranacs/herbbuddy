-- 1. Add status column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'upcoming';

-- 2. Create event_ratings table (if not exists)
CREATE TABLE IF NOT EXISTS event_ratings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  rater_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vibe_score integer CHECK (vibe_score >= 1 AND vibe_score <= 5),
  trust_score integer CHECK (trust_score >= 1 AND trust_score <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, rater_id, rated_user_id)
);

-- 3. Enable RLS
ALTER TABLE event_ratings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow anyone to read ratings (public profiles need this)
CREATE POLICY "Public ratings view" ON event_ratings
  FOR SELECT USING (true);

-- Allow users to insert their own ratings
CREATE POLICY "Users can insert ratings" ON event_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);
