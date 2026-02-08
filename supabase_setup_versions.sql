-- Create the app_versions table to manage app updates
CREATE TABLE IF NOT EXISTS app_versions (
  platform TEXT PRIMARY KEY,
  latest_version TEXT NOT NULL,
  force_update BOOLEAN DEFAULT false,
  update_url TEXT NOT NULL,
  message TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read version info
CREATE POLICY "Allow public read access"
ON app_versions
FOR SELECT
USING (true);

-- Create policy to allow ONLY authenticated users (or just you) to update version info
-- Note: Replace 'your-user-id' with your actual user ID if you want strict control,
-- or use the dashboard to update data manually (which bypasses RLS).
-- For now, we'll assume manual updates via dashboard, so no write policy needed for public.

-- Initial Data Seed
INSERT INTO app_versions (platform, latest_version, force_update, update_url, message)
VALUES 
(
  'android',
  '1.0.0',
  false,
  'https://github.com/vimal/herbbuddy/releases/latest',
  'Please update HerbBuddy to continue using the app.'
),
(
  'ios',
  '1.0.0',
  false,
  'https://github.com/vimal/herbbuddy/releases/latest',
  'Please update HerbBuddy to continue using the app.'
)
ON CONFLICT (platform)
DO UPDATE SET
  latest_version = EXCLUDED.latest_version,
  force_update = EXCLUDED.force_update,
  update_url = EXCLUDED.update_url,
  message = EXCLUDED.message;
