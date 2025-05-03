-- Profiles Table Queries
-- Select
SELECT * FROM profiles WHERE user_id = :userId;
SELECT role FROM profiles WHERE user_id = :userId;
SELECT interests, learning_goals, weekly_learning_time FROM profiles WHERE user_id = :userId;

-- Insert
INSERT INTO profiles (user_id, interests, learning_goals, weekly_learning_time, role)
VALUES (:userId, :interests, :learningGoals, :weeklyLearningTime, :role);

-- Update
UPDATE profiles 
SET interests = :interests,
    learning_goals = :learningGoals,
    weekly_learning_time = :weeklyLearningTime
WHERE user_id = :userId;

-- User Roadmaps Table Queries
-- Select
SELECT * FROM user_roadmaps WHERE user_id = :userId;
SELECT roadmap_id FROM user_roadmaps WHERE user_id = :userId;

-- Modules Table Queries
-- Select
SELECT * FROM modules WHERE id = :moduleId;
SELECT * FROM modules WHERE roadmap_id = :roadmapId;

-- User Progress Table Queries
-- Select
SELECT * FROM user_progress WHERE user_id = :userId AND module_id = :moduleId;
SELECT id FROM user_progress WHERE user_id = :userId;

-- Insert
INSERT INTO user_progress (user_id, module_id, status)
VALUES (:userId, :moduleId, 'not_started');

-- Update
UPDATE user_progress 
SET status = :status,
    completed_at = :completedAt
WHERE user_id = :userId AND module_id = :moduleId;

-- Resources Table Queries
-- Select
SELECT * FROM resources WHERE module_id = :moduleId;

-- Discussions Table Queries
-- Select
SELECT * FROM discussions WHERE module_id = :moduleId;

-- Insert
INSERT INTO discussions (module_id, title, content, user_id)
VALUES (:moduleId, :title, :content, :userId);

-- Comments Table Queries
-- Select
SELECT * FROM comments WHERE discussion_id = :discussionId;

-- Insert
INSERT INTO comments (discussion_id, content, user_id, parent_id)
VALUES (:discussionId, :content, :userId, :parentId);

-- XP Transactions Table Queries
-- Select
SELECT amount FROM xp_transactions WHERE user_id = :userId;

-- Insert
INSERT INTO xp_transactions (user_id, amount, description, module_id)
VALUES (:userId, :amount, :description, :moduleId);

-- Badges Table Queries
-- Select
SELECT * FROM badges;

-- User Badges Table Queries
-- Select
SELECT * FROM user_badges WHERE user_id = :userId;

-- Roadmaps Table Queries
-- Select
SELECT * FROM roadmaps ORDER BY created_at DESC;
SELECT * FROM roadmaps WHERE id = :roadmapId; 