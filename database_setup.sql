-- Create Tables

-- Profiles Table
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL UNIQUE,
    interests TEXT[] DEFAULT '{}',
    learning_goals TEXT,
    weekly_learning_time INTEGER DEFAULT 0,
    specialization TEXT[] DEFAULT '{}',
    role TEXT CHECK (role IN ('learner', 'content_curator')) DEFAULT 'learner'
);

-- Roadmaps Table
CREATE TABLE roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    title TEXT NOT NULL,
    description TEXT,
    skill_category TEXT NOT NULL,
    duration_weeks INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(user_id)
);

-- User Roadmaps Table
CREATE TABLE user_roadmaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, roadmap_id)
);

-- Modules Table
CREATE TABLE modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    roadmap_id UUID NOT NULL REFERENCES roadmaps(id),
    title TEXT NOT NULL,
    description TEXT,
    week_number INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 0
);

-- User Progress Table
CREATE TABLE user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    module_id UUID NOT NULL REFERENCES modules(id),
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, module_id)
);

-- Resources Table
CREATE TABLE resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    module_id UUID NOT NULL REFERENCES modules(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('video', 'blog', 'quiz', 'file')) NOT NULL,
    url TEXT,
    file_path TEXT
);

-- Discussions Table
CREATE TABLE discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    module_id UUID NOT NULL REFERENCES modules(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(user_id)
);

-- Comments Table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discussion_id UUID NOT NULL REFERENCES discussions(id),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    parent_id UUID REFERENCES comments(id)
);

-- Badges Table
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    badge_type TEXT CHECK (badge_type IN ('streak', 'progress', 'mastery')) NOT NULL,
    requirement INTEGER NOT NULL
);

-- User Badges Table
CREATE TABLE user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    badge_id UUID NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- XP Transactions Table
CREATE TABLE xp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    module_id UUID REFERENCES modules(id)
);

-- Create Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_user_roadmaps_user_id ON user_roadmaps(user_id);
CREATE INDEX idx_user_roadmaps_roadmap_id ON user_roadmaps(roadmap_id);
CREATE INDEX idx_modules_roadmap_id ON modules(roadmap_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX idx_resources_module_id ON resources(module_id);
CREATE INDEX idx_discussions_module_id ON discussions(module_id);
CREATE INDEX idx_comments_discussion_id ON comments(discussion_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);

-- Insert Sample Data

-- Insert Sample Admin Profile
INSERT INTO profiles (user_id, role, interests, learning_goals, weekly_learning_time)
VALUES (
    '11111111-1111-1111-1111-111111111111',  -- Replace this with your actual admin user ID from Supabase Auth
    'admin',
    ARRAY['Programming', 'Web Development'],
    'Create comprehensive learning paths for students',
    40
);

-- Insert Sample Content Curator Profile
INSERT INTO profiles (user_id, role, interests, specialization)
VALUES (
    '11111111-1111-1111-1111-111111111111',  -- Replace this with your actual admin user ID from Supabase Auth
    'content_curator',
    ARRAY['Programming', 'Web Development'],
    ARRAY['Frontend Development', 'Backend Development', 'Full Stack Development']
);

-- Insert Sample Badges
INSERT INTO badges (name, description, image_url, badge_type, requirement) VALUES
('Early Bird', 'Complete your first module', '/badges/early-bird.png', 'progress', 1),
('Week Warrior', 'Complete 7 days of learning', '/badges/week-warrior.png', 'streak', 7),
('Module Master', 'Complete 5 modules', '/badges/module-master.png', 'mastery', 5);

-- Insert Sample Roadmap
INSERT INTO roadmaps (title, description, skill_category, duration_weeks, created_by)
VALUES (
    'Web Development Fundamentals',
    'Learn the basics of web development',
    'Programming',
    12,
    '11111111-1111-1111-1111-111111111111'  -- Using the admin profile ID
);

-- Insert Sample Module
INSERT INTO modules (roadmap_id, title, description, week_number, xp_reward)
VALUES (
    (SELECT id FROM roadmaps WHERE title = 'Web Development Fundamentals' LIMIT 1),
    'HTML Basics',
    'Learn the fundamentals of HTML',
    1,
    100
); 