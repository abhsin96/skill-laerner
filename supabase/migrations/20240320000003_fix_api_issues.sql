-- Drop existing tables if they exist
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;

-- Create user_stats table with correct types
CREATE TABLE user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    modules_completed INTEGER DEFAULT 0,
    roadmaps_completed INTEGER DEFAULT 0,
    discussions_created INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    perfect_weeks INTEGER DEFAULT 0,
    early_bird_completions INTEGER DEFAULT 0,
    night_owl_completions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create xp_transactions table with correct types
CREATE TABLE xp_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_module_id ON xp_transactions(module_id);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP transactions"
    ON xp_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions"
    ON xp_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to handle XP transactions
CREATE OR REPLACE FUNCTION handle_xp_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_stats with new XP
    UPDATE user_stats
    SET xp_earned = xp_earned + NEW.amount
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for XP transactions
DROP TRIGGER IF EXISTS xp_transaction_trigger ON xp_transactions;
CREATE TRIGGER xp_transaction_trigger
    AFTER INSERT ON xp_transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_xp_transaction();

-- Create function to handle module completion
CREATE OR REPLACE FUNCTION handle_module_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Update modules_completed count
        UPDATE user_stats
        SET modules_completed = modules_completed + 1
        WHERE user_id = NEW.user_id;
        
        -- Insert XP transaction
        INSERT INTO xp_transactions (user_id, amount, type, description, module_id)
        VALUES (NEW.user_id, 50, 'module_completion', 'Completed module', NEW.module_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for module completion
DROP TRIGGER IF EXISTS module_completion_trigger ON user_progress;
CREATE TRIGGER module_completion_trigger
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION handle_module_completion();

-- Create or update user_stats for existing users
INSERT INTO user_stats (
    user_id,
    modules_completed,
    roadmaps_completed,
    discussions_created,
    comments_made,
    xp_earned,
    consecutive_days,
    perfect_weeks,
    early_bird_completions,
    night_owl_completions
)
SELECT 
    up.user_id,
    COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as modules_completed,
    0 as roadmaps_completed,
    0 as discussions_created,
    0 as comments_made,
    COALESCE(SUM(xt.amount), 0) as xp_earned,
    0 as consecutive_days,
    0 as perfect_weeks,
    0 as early_bird_completions,
    0 as night_owl_completions
FROM user_progress up
LEFT JOIN xp_transactions xt ON xt.user_id = up.user_id
WHERE up.user_id NOT IN (SELECT user_id FROM user_stats)
GROUP BY up.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_stats TO authenticated;
GRANT SELECT, INSERT ON xp_transactions TO authenticated;
GRANT USAGE ON SEQUENCE user_stats_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE xp_transactions_id_seq TO authenticated; 