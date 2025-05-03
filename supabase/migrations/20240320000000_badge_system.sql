-- Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    modules_completed INTEGER DEFAULT 0,
    roadmaps_completed INTEGER DEFAULT 0,
    discussions_created INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    perfect_weeks INTEGER DEFAULT 0,
    early_bird_completions INTEGER DEFAULT 0,
    night_owl_completions INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria_type TEXT NOT NULL,
    criteria_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id, badge_id)
);

-- Create xp_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Insert default badges if they don't exist
INSERT INTO badges (id, name, description, icon, criteria_type, criteria_value, xp_reward, category)
VALUES
    ('first_module', 'First Steps', 'Complete your first module', '📚', 'modules_completed', 1, 50, 'learning'),
    ('module_master', 'Module Master', 'Complete 10 modules', '📚', 'modules_completed', 10, 200, 'learning'),
    ('roadmap_completer', 'Roadmap Champion', 'Complete your first roadmap', '🎯', 'roadmaps_completed', 1, 500, 'mastery'),
    ('discussion_starter', 'Discussion Starter', 'Create your first discussion', '💭', 'discussions_created', 1, 100, 'social'),
    ('active_commenter', 'Active Commenter', 'Make 10 comments', '💬', 'comments_made', 10, 150, 'engagement'),
    ('xp_collector', 'XP Collector', 'Earn 1000 XP', '✨', 'xp_earned', 1000, 200, 'mastery'),
    ('streak_3', '3-Day Streak', 'Learn for 3 consecutive days', '🔥', 'consecutive_days', 3, 100, 'special'),
    ('streak_7', '7-Day Streak', 'Learn for 7 consecutive days', '🔥', 'consecutive_days', 7, 300, 'special'),
    ('perfect_week', 'Perfect Week', 'Complete all modules in a week', '🌟', 'perfect_week', 1, 500, 'special'),
    ('early_bird', 'Early Bird', 'Complete a module before 9 AM', '🌅', 'early_bird', 1, 100, 'special'),
    ('night_owl', 'Night Owl', 'Complete a module after 9 PM', '🌙', 'night_owl', 1, 100, 'special')
ON CONFLICT (id) DO NOTHING;

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update modules_completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE user_stats
        SET modules_completed = modules_completed + 1,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_progress
DROP TRIGGER IF EXISTS update_user_stats_trigger ON user_progress;
CREATE TRIGGER update_user_stats_trigger
    AFTER UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

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
                        
                        -- Update total XP
                        UPDATE user_stats
                        SET xp_earned = xp_earned + badge_record.xp_reward
                        WHERE user_id = NEW.user_id;
                    END IF;
                -- Add other badge types here as needed
            END CASE;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_stats
DROP TRIGGER IF EXISTS check_badges_trigger ON user_stats;
CREATE TRIGGER check_badges_trigger
    AFTER UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Add RLS policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own badges"
    ON user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP transactions"
    ON xp_transactions FOR SELECT
    USING (auth.uid() = user_id); 