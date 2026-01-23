-- FIX: Referral bonus function had a bug where it compared column to itself
-- Run this in your Supabase SQL Editor to fix the referral system

-- First drop the existing function
DROP FUNCTION IF EXISTS apply_referral_bonus(text, text);

-- Recreate the function with fixed parameter names
CREATE OR REPLACE FUNCTION apply_referral_bonus(p_ref_code TEXT, p_referred_wallet TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_wallet TEXT;
  v_already_referred BOOLEAN;
BEGIN
  -- Check if this wallet was already referred
  SELECT EXISTS(
    SELECT 1 FROM referrals WHERE referred_wallet = p_referred_wallet
  ) INTO v_already_referred;

  IF v_already_referred THEN
    RETURN FALSE;
  END IF;

  -- Find referrer by their referral code
  SELECT wallet_address INTO v_referrer_wallet
  FROM submissions
  WHERE referrer_code = p_ref_code;

  IF v_referrer_wallet IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Don't allow self-referral
  IF v_referrer_wallet = p_referred_wallet THEN
    RETURN FALSE;
  END IF;

  -- Insert referral record
  INSERT INTO referrals (referrer_wallet, referred_wallet, referral_code)
  VALUES (v_referrer_wallet, p_referred_wallet, p_ref_code);

  -- Give bonus to referrer (50 points added to their submission score)
  UPDATE submissions
  SET score = score + 50
  WHERE wallet_address = v_referrer_wallet;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- OPTIONAL: Update existing submissions to have consistent referral codes
-- This will update referrer_code to match what the profile page shows
-- WARNING: This may break existing referral links that were shared!
-- Only run if you want to reset all referral codes:

-- UPDATE submissions 
-- SET referrer_code = UPPER(SUBSTRING(wallet_address FROM 3 FOR 8))
-- WHERE referrer_code IS NOT NULL;

-- Verify the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'apply_referral_bonus';
