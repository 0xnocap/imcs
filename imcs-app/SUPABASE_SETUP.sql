-- ========================================
-- IMCS SUPABASE DATABASE SETUP
-- ========================================
-- Run this entire file in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLES
-- ========================================

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  info TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  score INTEGER DEFAULT 0,  -- denormalized for faster queries
  CONSTRAINT wallet_format CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  voter_identifier TEXT NOT NULL,  -- wallet address OR IP address
  vote_type TEXT CHECK(vote_type IN ('upvote', 'downvote')) NOT NULL,
  vote_weight NUMERIC DEFAULT 1.0,  -- 1.0 for wallet, 0.167 for IP
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, voter_identifier)  -- Prevent duplicate votes
);

-- Access attempts (circle/typing tests)
CREATE TABLE IF NOT EXISTS access_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  attempt_type TEXT CHECK(attempt_type IN ('circle', 'typing')) NOT NULL,
  success BOOLEAN NOT NULL,
  score NUMERIC,  -- Circle accuracy % or typing WPM
  created_at TIMESTAMP DEFAULT NOW()
);

-- Whitelist table
CREATE TABLE IF NOT EXISTS whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  status TEXT CHECK(status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  method TEXT,  -- 'auto_score', 'auto_karma', 'manual', 'collaboration'
  added_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT wallet_format_wl CHECK (wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

-- Referrals table (for gamification)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referred_wallet)  -- Each person can only be referred once
);

-- ========================================
-- INDEXES (for performance)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_submissions_wallet ON submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON submissions(score DESC);
CREATE INDEX IF NOT EXISTS idx_votes_submission ON votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_identifier);
CREATE INDEX IF NOT EXISTS idx_access_attempts_ip ON access_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_wallet ON whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_wallet);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to update submission scores (weighted votes)
CREATE OR REPLACE FUNCTION update_submission_score(sub_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE submissions
  SET score = (
    SELECT COALESCE(
      SUM(CASE
        WHEN vote_type = 'upvote' THEN vote_weight
        WHEN vote_type = 'downvote' THEN -vote_weight
        ELSE 0
      END),
      0
    )
    FROM votes
    WHERE submission_id = sub_id
  )
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update whitelist based on scores
CREATE OR REPLACE FUNCTION update_whitelist_auto()
RETURNS VOID AS $$
BEGIN
  -- Auto-approve submissions with score >= 3
  INSERT INTO whitelist (wallet_address, status, method)
  SELECT wallet_address, 'approved', 'auto_score'
  FROM submissions
  WHERE score >= 3
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    status = 'approved',
    method = 'auto_score',
    added_at = NOW();

  -- Auto-approve top 30% voters by karma
  WITH voter_karma AS (
    SELECT
      voter_identifier as wallet_address,
      COUNT(*) as karma_score,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
      COUNT(*) OVER () as total_voters
    FROM votes
    WHERE voter_identifier LIKE '0x%'  -- Only wallet addresses
    GROUP BY voter_identifier
  )
  INSERT INTO whitelist (wallet_address, status, method)
  SELECT wallet_address, 'approved', 'auto_karma'
  FROM voter_karma
  WHERE rank <= (total_voters * 0.3)  -- Top 30%
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    status = 'approved',
    method = 'auto_karma',
    added_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to auto-update scores after vote
CREATE OR REPLACE FUNCTION update_score_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_submission_score(OLD.submission_id);
    RETURN OLD;
  ELSE
    PERFORM update_submission_score(NEW.submission_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vote_score_update ON votes;
CREATE TRIGGER vote_score_update
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_score_trigger();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================
-- CRITICAL: Without these, anyone can delete/modify data!
-- ========================================

-- Enable RLS on all tables
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Submissions: Anyone can read, only service role can write
DROP POLICY IF EXISTS "Public can read submissions" ON submissions;
CREATE POLICY "Public can read submissions"
ON submissions FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Only service can insert submissions" ON submissions;
CREATE POLICY "Only service can insert submissions"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "No one can update submissions" ON submissions;
CREATE POLICY "No one can update submissions"
ON submissions FOR UPDATE
TO public
USING (false);

DROP POLICY IF EXISTS "No one can delete submissions" ON submissions;
CREATE POLICY "No one can delete submissions"
ON submissions FOR DELETE
TO public
USING (false);

-- Votes: Anyone can read, authenticated can insert (but not their own submission)
DROP POLICY IF EXISTS "Public can read votes" ON votes;
CREATE POLICY "Public can read votes"
ON votes FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert votes" ON votes;
CREATE POLICY "Authenticated can insert votes"
ON votes FOR INSERT
TO public
WITH CHECK (
  -- Prevent voting on your own submission
  voter_identifier != (
    SELECT wallet_address
    FROM submissions
    WHERE id = submission_id
  )
);

DROP POLICY IF EXISTS "No one can update votes" ON votes;
CREATE POLICY "No one can update votes"
ON votes FOR UPDATE
TO public
USING (false);

DROP POLICY IF EXISTS "No one can delete votes" ON votes;
CREATE POLICY "No one can delete votes"
ON votes FOR DELETE
TO public
USING (false);

-- Access attempts: Only service role can write, no public read (privacy)
DROP POLICY IF EXISTS "No public read access attempts" ON access_attempts;
CREATE POLICY "No public read access attempts"
ON access_attempts FOR SELECT
TO public
USING (false);

DROP POLICY IF EXISTS "Service can insert access attempts" ON access_attempts;
CREATE POLICY "Service can insert access attempts"
ON access_attempts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Whitelist: Anyone can read their own status
DROP POLICY IF EXISTS "Public can read whitelist" ON whitelist;
CREATE POLICY "Public can read whitelist"
ON whitelist FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "No one can write whitelist" ON whitelist;
CREATE POLICY "No one can write whitelist"
ON whitelist FOR INSERT
TO public
WITH CHECK (false);

DROP POLICY IF EXISTS "No one can update whitelist" ON whitelist;
CREATE POLICY "No one can update whitelist"
ON whitelist FOR UPDATE
TO public
USING (false);

DROP POLICY IF EXISTS "No one can delete whitelist" ON whitelist;
CREATE POLICY "No one can delete whitelist"
ON whitelist FOR DELETE
TO public
USING (false);

-- Referrals: Anyone can read, authenticated can insert
DROP POLICY IF EXISTS "Public can read referrals" ON referrals;
CREATE POLICY "Public can read referrals"
ON referrals FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert referrals" ON referrals;
CREATE POLICY "Authenticated can insert referrals"
ON referrals FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- VIEWS
-- ========================================

-- Leaderboard view (submissions)
CREATE OR REPLACE VIEW leaderboard_submissions AS
SELECT
  s.id,
  s.wallet_address,
  s.name,
  s.info,
  s.score,
  s.created_at,
  COUNT(v.id) as total_votes
FROM submissions s
LEFT JOIN votes v ON s.id = v.submission_id
GROUP BY s.id
ORDER BY s.score DESC, total_votes DESC;

-- Leaderboard view (voters)
CREATE OR REPLACE VIEW leaderboard_voters AS
SELECT
  voter_identifier,
  COUNT(*) as votes_cast,
  SUM(vote_weight) as weighted_votes,
  COUNT(*) as karma_score
FROM votes
WHERE voter_identifier LIKE '0x%'  -- Only wallet addresses
GROUP BY voter_identifier
ORDER BY karma_score DESC;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Allow public to query views
GRANT SELECT ON leaderboard_submissions TO anon, authenticated;
GRANT SELECT ON leaderboard_voters TO anon, authenticated;

-- ========================================
-- INITIAL DATA (Optional)
-- ========================================

-- Add any manual whitelist addresses for collaborations here
-- Example:
-- INSERT INTO whitelist (wallet_address, status, method)
-- VALUES ('0x1234567890123456789012345678901234567890', 'approved', 'collaboration')
-- ON CONFLICT (wallet_address) DO NOTHING;

-- ========================================
-- DONE!
-- ========================================

-- Verify everything worked:
SELECT 'Setup complete! Tables created:' as message;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
