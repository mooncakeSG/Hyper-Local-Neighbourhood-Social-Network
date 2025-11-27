-- Post Mentions table migration
-- Run this in your Supabase SQL Editor

-- Create post_mentions table
CREATE TABLE IF NOT EXISTS post_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, mentioned_user_id) -- Prevent duplicate mentions
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_mentions_post ON post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_user ON post_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_created ON post_mentions(created_at DESC);

-- Enable RLS on post_mentions
ALTER TABLE post_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_mentions

-- Users can view mentions on posts in their neighbourhood
CREATE POLICY "Users can view mentions on posts in their neighbourhood"
    ON post_mentions FOR SELECT
    USING (
        post_id IN (
            SELECT id FROM posts
            WHERE neighbourhood_id IN (
                SELECT neighbourhood_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can create mentions when creating posts in their neighbourhood
CREATE POLICY "Users can create mentions on posts in their neighbourhood"
    ON post_mentions FOR INSERT
    WITH CHECK (
        post_id IN (
            SELECT id FROM posts
            WHERE neighbourhood_id IN (
                SELECT neighbourhood_id FROM users WHERE id = auth.uid()
            )
        )
    );

