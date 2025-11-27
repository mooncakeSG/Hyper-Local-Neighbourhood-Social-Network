-- Profile Enhancements Migration
-- Run this in your Supabase SQL Editor

-- Add avatar_url and bio columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index on avatar_url for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_avatar ON users(avatar_url) WHERE avatar_url IS NOT NULL;

-- Note: created_at already exists and tracks join date
-- neighbourhood_id tracks when user joined neighbourhood (via updated_at or separate tracking)

