-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can view their own XP transactions" ON xp_transactions;
DROP POLICY IF EXISTS "Users can insert their own XP transactions" ON xp_transactions;

-- Enable RLS on all tables
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for user_stats
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create comprehensive RLS policies for user_badges
CREATE POLICY "Users can view their own badges"
    ON user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
    ON user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create comprehensive RLS policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions"
    ON xp_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions"
    ON xp_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
    earned_badge RECORD;
BEGIN
    -- Check each badge
    FOR badge_record IN SELECT * FROM badges LOOP
        -- Check if user already has this badge
        SELECT * INTO earned_badge
        FROM user_badges
        WHERE user_id = NEW.user_id AND badge_id = badge_record.id;

        IF earned_badge IS NULL THEN
            -- Check if user meets criteria
            CASE badge_record.criteria_type
                WHEN 'modules_completed' THEN
                    IF NEW.modules_completed >= badge_record.criteria_value THEN
                        -- Award badge
                        INSERT INTO user_badges (user_id, badge_id)
                        VALUES (NEW.user_id, badge_record.id);
                        
                        -- Award XP
                        INSERT INTO xp_transactions (user_id, amount, type, description)
                        VALUES (NEW.user_id, badge_record.xp_reward, 'badge', 'Earned ' || badge_record.name || ' badge');
                    END IF;
                WHEN 'xp_earned' THEN
                    IF NEW.xp_earned >= badge_record.criteria_value THEN
                        -- Award badge
                        INSERT INTO user_badges (user_id, badge_id)
                        VALUES (NEW.user_id, badge_record.id);
                        
                        -- Award XP
                        INSERT INTO xp_transactions (user_id, amount, type, description)
                        VALUES (NEW.user_id, badge_record.xp_reward, 'badge', 'Earned ' || badge_record.name || ' badge');
                    END IF;
            END CASE;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for badge checking
DROP TRIGGER IF EXISTS check_badges_trigger ON user_stats;
CREATE TRIGGER check_badges_trigger
    AFTER UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_stats TO authenticated;
GRANT SELECT, INSERT ON user_badges TO authenticated;
GRANT SELECT, INSERT ON xp_transactions TO authenticated;

-- Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS user_badges_id_seq;
CREATE SEQUENCE IF NOT EXISTS xp_transactions_id_seq;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE user_badges_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE xp_transactions_id_seq TO authenticated; 