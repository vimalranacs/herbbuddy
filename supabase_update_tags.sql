-- Add tags and contribution_needed columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contribution_needed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contribution_details text; -- E.g., "$10 entry", "Bring snacks"

-- Add index for faster tag filtering (optional but good)
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN (tags);

-- Comment explaining the columns (metadata)
COMMENT ON COLUMN events.tags IS 'Array of tags like ["Party", "Study", "Outdoor"]';
COMMENT ON COLUMN events.contribution_details IS 'Details about required contribution (money or items)';
