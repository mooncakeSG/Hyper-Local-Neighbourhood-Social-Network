-- Likes table migration
-- Run this in your Supabase SQL Editor

-- Create likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created ON post_likes(created_at DESC);

-- Enable RLS on post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes

-- Users can view likes on posts in their neighbourhood
CREATE POLICY "Users can view likes on posts in their neighbourhood"
    ON post_likes FOR SELECT
    USING (
        post_id IN (
            SELECT id FROM posts
            WHERE neighbourhood_id IN (
                SELECT neighbourhood_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can create likes on posts in their neighbourhood
CREATE POLICY "Users can create likes on posts in their neighbourhood"
    ON post_likes FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        post_id IN (
            SELECT id FROM posts
            WHERE neighbourhood_id IN (
                SELECT neighbourhood_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
    ON post_likes FOR DELETE
    USING (user_id = auth.uid());

-- Function to update likes_count on posts table
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts 
        SET likes_count = (
            SELECT COUNT(*) FROM post_likes WHERE post_id = NEW.post_id
        )
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET likes_count = (
            SELECT COUNT(*) FROM post_likes WHERE post_id = OLD.post_id
        )
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes_count
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- Update existing posts to have correct likes_count (should be 0)
UPDATE posts SET likes_count = 0 WHERE likes_count IS NULL;

