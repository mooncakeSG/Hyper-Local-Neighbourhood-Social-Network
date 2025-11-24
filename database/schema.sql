-- Neighbourhood Social Network Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Neighbourhoods table
CREATE TABLE IF NOT EXISTS neighbourhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    province VARCHAR(255),
    country VARCHAR(100) DEFAULT 'South Africa',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    neighbourhood_id UUID REFERENCES neighbourhoods(id) ON DELETE SET NULL,
    onesignal_player_id VARCHAR(255),
    invite_code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    neighbourhood_id UUID NOT NULL REFERENCES neighbourhoods(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'post' CHECK (type IN ('post', 'alert')),
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    neighbourhood_id UUID NOT NULL REFERENCES neighbourhoods(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    address TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_neighbourhood ON users(neighbourhood_id);
CREATE INDEX IF NOT EXISTS idx_posts_neighbourhood ON posts(neighbourhood_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_businesses_neighbourhood ON businesses(neighbourhood_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbourhoods ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view other users in their neighbourhood"
    ON users FOR SELECT
    USING (
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

-- Posts policies
CREATE POLICY "Users can view posts in their neighbourhood"
    ON posts FOR SELECT
    USING (
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create posts in their neighbourhood"
    ON posts FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own posts"
    ON posts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
    ON posts FOR DELETE
    USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Users can view comments on posts in their neighbourhood"
    ON comments FOR SELECT
    USING (
        post_id IN (
            SELECT id FROM posts
            WHERE neighbourhood_id IN (
                SELECT neighbourhood_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create comments"
    ON comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        post_id IN (
            SELECT id FROM posts
            WHERE neighbourhood_id IN (
                SELECT neighbourhood_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own comments"
    ON comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON comments FOR DELETE
    USING (user_id = auth.uid());

-- Businesses policies
CREATE POLICY "Users can view businesses in their neighbourhood"
    ON businesses FOR SELECT
    USING (
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create businesses in their neighbourhood"
    ON businesses FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own businesses"
    ON businesses FOR UPDATE
    USING (user_id = auth.uid());

-- Neighbourhoods policies
CREATE POLICY "Users can view all neighbourhoods"
    ON neighbourhoods FOR SELECT
    USING (true);

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite codes
CREATE TRIGGER set_invite_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_invite_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

