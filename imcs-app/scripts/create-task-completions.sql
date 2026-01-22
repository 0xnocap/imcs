-- Task completions table for tracking game/task completion and points

-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  task_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, task_type)
);

-- Index for faster lookups by wallet
CREATE INDEX IF NOT EXISTS idx_task_completions_wallet ON task_completions(wallet_address);

-- Index for task type queries
CREATE INDEX IF NOT EXISTS idx_task_completions_type ON task_completions(task_type);

-- Example task types:
-- 'circle' - Circle drawing test (100-300 pts based on accuracy)
-- 'typing' - Typing test (100-200 pts based on WPM)
-- 'bubble' - Bubble pop game (1 pt per bubble popped)
-- 'paint' - MS Paint savant drawing (200 pts flat)
-- 'submit' - Form submission (150 pts)
-- 'vote' - Voting milestone (100 pts per 10 votes)

-- ============================================
-- MIGRATION: Backfill existing user activity
-- ============================================

-- 1. Credit users who have submissions (150 pts for 'submit' task)
INSERT INTO task_completions (wallet_address, task_type, score, completed_at)
SELECT
  wallet_address,
  'submit',
  150,
  created_at
FROM submissions
WHERE wallet_address IS NOT NULL
ON CONFLICT (wallet_address, task_type) DO NOTHING;

-- 2. Credit users who have voted with their wallet address
-- (voter_identifier that looks like an ETH address: starts with 0x and is 42 chars)
-- Award 100 pts per 10 votes
INSERT INTO task_completions (wallet_address, task_type, score, completed_at)
SELECT
  LOWER(voter_identifier) as wallet_address,
  'vote',
  GREATEST(100, (COUNT(*) / 10) * 100) as score,
  MAX(created_at) as completed_at
FROM votes
WHERE voter_identifier LIKE '0x%'
  AND LENGTH(voter_identifier) = 42
GROUP BY LOWER(voter_identifier)
HAVING COUNT(*) >= 10
ON CONFLICT (wallet_address, task_type) DO UPDATE
  SET score = GREATEST(task_completions.score, EXCLUDED.score);

-- 3. Credit circle test completions where we can match IP to a submission
-- (This links access_attempts.ip_address to submissions.ip_address)
INSERT INTO task_completions (wallet_address, task_type, score, completed_at)
SELECT DISTINCT ON (s.wallet_address)
  s.wallet_address,
  'circle',
  CASE
    WHEN a.score >= 95 THEN 300
    WHEN a.score >= 90 THEN 250
    WHEN a.score >= 85 THEN 200
    WHEN a.score >= 80 THEN 150
    WHEN a.score >= 75 THEN 100
    ELSE 0
  END as score,
  a.created_at
FROM access_attempts a
JOIN submissions s ON a.ip_address = s.ip_address
WHERE a.attempt_type = 'circle'
  AND a.success = true
  AND a.score >= 75
  AND s.wallet_address IS NOT NULL
ORDER BY s.wallet_address, a.score DESC
ON CONFLICT (wallet_address, task_type) DO UPDATE
  SET score = GREATEST(task_completions.score, EXCLUDED.score);

-- 4. Credit typing test completions where we can match IP to a submission
INSERT INTO task_completions (wallet_address, task_type, score, completed_at)
SELECT DISTINCT ON (s.wallet_address)
  s.wallet_address,
  'typing',
  CASE
    WHEN a.score >= 60 THEN 200
    WHEN a.score >= 45 THEN 150
    WHEN a.score >= 30 THEN 100
    ELSE 0
  END as score,
  a.created_at
FROM access_attempts a
JOIN submissions s ON a.ip_address = s.ip_address
WHERE a.attempt_type = 'typing'
  AND a.success = true
  AND a.score >= 30
  AND s.wallet_address IS NOT NULL
ORDER BY s.wallet_address, a.score DESC
ON CONFLICT (wallet_address, task_type) DO UPDATE
  SET score = GREATEST(task_completions.score, EXCLUDED.score);

-- ============================================
-- View the migration results
-- ============================================
-- SELECT task_type, COUNT(*) as users, SUM(score) as total_points
-- FROM task_completions
-- GROUP BY task_type;
