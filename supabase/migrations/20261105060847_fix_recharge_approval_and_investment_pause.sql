/*
  # Fix recharge approval crash and investment pause error

  ## Root causes
  1. credit_referral_bonus_on_recharge declared v_referrer_id as uuid but
     selected referred_by (text, stores referral codes) directly into it.
     Invalid values like "VIDEO " crash with invalid input syntax for type uuid,
     aborting the entire approve_recharge call.
  2. check_withdrawal_eligibility compared referred_by (text) to p_user_id (uuid),
     causing the same implicit-cast crash.
  3. investments status CHECK constraint only allowed active/completed/cancelled
     but admin_manage_investment sets status='paused', violating the constraint.

  ## Fixes
  - credit_referral_bonus_on_recharge: look up referrer by matching referral_code
  - check_withdrawal_eligibility: compare referred_by to the user's referral_code
  - investments CHECK: add 'paused' to allowed statuses
  - Clean invalid referred_by data
*/

-- 1. Fix credit_referral_bonus_on_recharge to look up referrer by referral_code
CREATE OR REPLACE FUNCTION public.credit_referral_bonus_on_recharge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
  v_bonus numeric;
  v_referral_name text;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status <> 'approved' AND NEW.status = 'approved') OR
     (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN

    SELECT referred_by INTO v_referral_code
    FROM profiles
    WHERE id = NEW.user_id;

    IF v_referral_code IS NULL THEN
      RETURN NEW;
    END IF;

    -- Look up referrer by their referral_code, not by casting text to uuid
    SELECT id INTO v_referrer_id
    FROM profiles
    WHERE referral_code = v_referral_code;

    IF v_referrer_id IS NULL THEN
      RETURN NEW;
    END IF;

    v_bonus := round(NEW.amount * 0.005, 2);

    IF v_bonus > 0 THEN
      UPDATE profiles
      SET wallet_balance = wallet_balance + v_bonus
      WHERE id = v_referrer_id;

      SELECT full_name INTO v_referral_name
      FROM profiles
      WHERE id = NEW.user_id;

      INSERT INTO audit_logs (user_id, action, details)
      VALUES (
        v_referrer_id,
        'referral_bonus_credited',
        format('Referral bonus: %s PHP from %s recharge of %s PHP', v_bonus, v_referral_name, NEW.amount)
      );

      INSERT INTO admin_notifications (event_type, title, message, entity_id, user_id)
      VALUES (
        'referral_bonus',
        'Referral Bonus Earned',
        format('You earned %s PHP referral bonus from %s''s recharge.', v_bonus, v_referral_name),
        NEW.id,
        v_referrer_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Fix check_withdrawal_eligibility to compare referred_by to referral_code (text)
CREATE OR REPLACE FUNCTION public.check_withdrawal_eligibility(p_user_id uuid)
RETURNS TABLE(eligible boolean, total_referrals integer, qualified_referrals integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_total_referrals integer;
  v_qualified_referrals integer;
  v_required integer;
  v_referral_code text;
BEGIN
  SELECT referral_code INTO v_referral_code
  FROM profiles
  WHERE id = p_user_id;

  IF v_referral_code IS NULL THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  SELECT count(*) INTO v_total_referrals
  FROM profiles p
  WHERE p.referred_by = v_referral_code;

  SELECT count(DISTINCT p.id) INTO v_qualified_referrals
  FROM profiles p
  INNER JOIN recharge_logs r ON r.user_id = p.id AND r.status = 'approved' AND r.amount >= 500
  WHERE p.referred_by = v_referral_code;

  v_required := public.withdrawal_referrals_required(p_user_id);

  RETURN QUERY SELECT (v_qualified_referrals >= v_required), v_total_referrals, v_qualified_referrals;
END;
$$;

-- 3. Fix investments status CHECK to include 'paused'
ALTER TABLE public.investments DROP CONSTRAINT investments_status_check;
ALTER TABLE public.investments ADD CONSTRAINT investments_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text, 'paused'::text]));

-- 4. Clean invalid referred_by data (set to NULL where it doesn't match any referral_code)
UPDATE public.profiles
SET referred_by = NULL
WHERE referred_by IS NOT NULL
  AND referred_by NOT IN (SELECT referral_code FROM public.profiles WHERE referral_code IS NOT NULL);