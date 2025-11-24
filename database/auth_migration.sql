-- Migration: Switch from phone to email authentication
-- Run this in Supabase SQL Editor

-- Add email column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Add password column (Supabase Auth handles passwords, but we can store reset tokens)
-- Note: Actual passwords are stored in Supabase Auth, not in our users table

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update existing users to have email (if needed)
-- This is a placeholder - you'll need to migrate existing phone-based users

-- Add password reset token columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Create index on reset token
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);

