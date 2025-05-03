-- First, let's check if user_stats exists for all users with progress
INSERT INTO user_stats (user_id)
SELECT DISTINCT user_id 
FROM user_progress 
WHERE user_id NOT IN (SELECT user_id FROM user_stats);

-- Update user_stats with correct counts
UPDATE user_stats us
SET 
    modules_completed = (
        SELECT COUNT(*) 
        FROM user_progress up 
        WHERE up.user_id = us.user_id 
        AND up.status = 'completed'
    ),
    xp_earned = (
        SELECT COALESCE(SUM(amount), 0)
        FROM xp_transactions
        WHERE user_id = us.user_id
    ),
    updated_at = NOW();

-- Check for and award badges based on current stats
DO $$
DECLARE
    user_record RECORD;
    badge_record RECORD;
    earned_badge RECORD;
BEGIN
    -- Loop through all users
    FOR user_record IN 
        SELECT * FROM user_stats
    LOOP
        -- Loop through all badges
        FOR badge_record IN 
            SELECT * FROM badges
        LOOP
            -- Check if user already has this badge
            SELECT * INTO earned_badge
            FROM user_badges
            WHERE user_id = user_record.user_id 
            AND badge_id = badge_record.id;

            IF earned_badge IS NULL THEN
                -- Check if user meets criteria
                CASE badge_record.criteria_type
                    WHEN 'modules_completed' THEN
                        IF user_record.modules_completed >= badge_record.criteria_value THEN
                            -- Award badge
                            INSERT INTO user_badges (user_id, badge_id)
                            VALUES (user_record.user_id, badge_record.id);
                            
                            -- Award XP
                            INSERT INTO xp_transactions (user_id, amount, type, description)
                            VALUES (user_record.user_id, badge_record.xp_reward, 'badge', 'Earned ' || badge_record.name || ' badge');
                            
                            -- Update total XP
                            UPDATE user_stats
                            SET xp_earned = xp_earned + badge_record.xp_reward
                            WHERE user_id = user_record.user_id;
                        END IF;
                    WHEN 'xp_earned' THEN
                        IF user_record.xp_earned >= badge_record.criteria_value THEN
                            -- Award badge
                            INSERT INTO user_badges (user_id, badge_id)
                            VALUES (user_record.user_id, badge_record.id);
                            
                            -- Award XP
                            INSERT INTO xp_transactions (user_id, amount, type, description)
                            VALUES (user_record.user_id, badge_record.xp_reward, 'badge', 'Earned ' || badge_record.name || ' badge');
                            
                            -- Update total XP
                            UPDATE user_stats
                            SET xp_earned = xp_earned + badge_record.xp_reward
                            WHERE user_id = user_record.user_id;
                        END IF;
                END CASE;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add missing RLS policies for INSERT and UPDATE
CREATE POLICY "Users can update their own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
    ON user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP transactions"
    ON xp_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add missing badge criteria types to the check_and_award_badges function
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
                WHEN 'xp_earned' THEN
                    IF NEW.xp_earned >= badge_record.criteria_value THEN
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
                WHEN 'roadmaps_completed' THEN
                    IF NEW.roadmaps_completed >= badge_record.criteria_value THEN
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
            END CASE;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 