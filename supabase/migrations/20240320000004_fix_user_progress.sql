-- Drop existing table if it exists
DROP TABLE IF EXISTS user_progress CASCADE;

-- Create user_progress table with correct types
CREATE TABLE user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
        NEW.started_at = NOW();
    ELSIF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = NOW();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_timestamps_trigger ON user_progress;
CREATE TRIGGER update_timestamps_trigger
    BEFORE INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamps();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_progress TO authenticated;
GRANT USAGE ON SEQUENCE user_progress_id_seq TO authenticated;

-- Migrate existing data if needed
INSERT INTO user_progress (user_id, module_id, status, started_at, completed_at)
SELECT 
    user_id::UUID,
    module_id::UUID,
    status,
    started_at,
    completed_at
FROM (
    SELECT * FROM user_progress_old
) old_data
ON CONFLICT (user_id, module_id) DO UPDATE
SET 
    status = EXCLUDED.status,
    started_at = EXCLUDED.started_at,
    completed_at = EXCLUDED.completed_at,
    updated_at = NOW(); 