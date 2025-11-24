-- Marketplace table
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    neighbourhood_id UUID NOT NULL REFERENCES neighbourhoods(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    condition VARCHAR(20) DEFAULT 'used' CHECK (condition IN ('new', 'like_new', 'used', 'fair')),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_neighbourhood ON marketplace_items(neighbourhood_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_user ON marketplace_items(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_created ON marketplace_items(created_at DESC);

-- Enable RLS on marketplace_items
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

-- Marketplace policies
CREATE POLICY "Users can view marketplace items in their neighbourhood"
    ON marketplace_items FOR SELECT
    USING (
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create marketplace items in their neighbourhood"
    ON marketplace_items FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        neighbourhood_id IN (
            SELECT neighbourhood_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own marketplace items"
    ON marketplace_items FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own marketplace items"
    ON marketplace_items FOR DELETE
    USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_updated_at BEFORE UPDATE ON marketplace_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

