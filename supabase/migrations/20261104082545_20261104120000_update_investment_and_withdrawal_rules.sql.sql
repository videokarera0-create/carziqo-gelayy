/*
# Update investment limits, withdrawal referral tiers, and add referral bonus

## Changes Summary

1. Investment minimum amount lowered from ₱500 to ₱300
2. Investment maximum amount lowered from ₱100,000 to ₱75,000
3. Withdrawal referral tier logic updated:
   - 1st withdrawal: 1 qualified referral
   - 2nd withdrawal: 2 qualified referrals
   - 3rd withdrawal: 3 qualified referrals
   - 4th withdrawal: 4 qualified referrals
   - 5th+ withdrawal: 5 qualified referrals
4. "Qualified referral" definition changed from "has investment ≥ ₱500" to "has recharge ≥ ₱500"
5. New referral bonus system: referrer earns 0.5% of referral's recharge amount (minimum), credited to wallet

## Detailed Changes

### Investment limits (create_investment function)
- Minimum: 500 → 300 PHP
- Maximum: 100000 → 75000 PHP
- Also updates the standalone check_investment_limit function for consistency

### Withdrawal referral tiers (withdrawal_referrals_required function)
- Old: 1st=1, 2nd=3, 3rd+=5
- New: 1st=1, 2nd=2, 3rd=3, 4th=4, 5th+=5

### Qualified referral definition (check_withdrawal_eligibility function)
- Old: referral has investment with amount >= 500 and status in ('active','completed')
- New: referral has approved recharge with amount >= 500

### Referral bonus (new trigger)
- When a recharge is approved (status changes to 'approved'), the referrer of that user receives a bonus
- Bonus = 0.5% of the recharge amount (minimum)
- Credited to referrer's wallet_balance
- An audit log entry is created for the referrer
- Only triggers on approved recharges, not rejected ones

## Security
- All functions remain SECURITY DEFINER with fixed search_path
- The new referral bonus trigger runs as SECURITY DEFINER to update the referrer's wallet
- No new grants needed — existing grants on recharge_logs, profiles, and audit_logs cover the trigger
*/

-- ============================================================
-- 1. Update investment limits in create_investment
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_investment(p_car_id uuid, p_amount numeric, p_duration_days integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_car record;
  v_user_id uuid := auth.uid();
  v_daily_rate numeric;
  v_daily_payout numeric;
  v_investment_id uuid;
  v_balance numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount < 300 THEN
    RAISE EXCEPTION 'Minimum investment amount is 300 PHP';
  END IF;

  IF p_amount > 75000 THEN
    RAISE EXCEPTION 'Maximum investment amount is 75,000 PHP';
  END IF;

  SELECT * INTO v_car FROM cars WHERE id = p_car_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car not available';
  END IF;

  IF v_car.is_free = true THEN
    SELECT id INTO v_investment_id FROM investments
      WHERE user_id = v_user_id AND car_id = p_car_id;
    IF FOUND THEN
      RAISE EXCEPTION 'You already have this free starter car';
    END IF;
  END IF;

  SELECT wallet_balance INTO v_balance FROM profiles WHERE id = v_user_id;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  v_daily_rate := CASE p_duration_days WHEN 30 THEN 0.02 WHEN 60 THEN 0.03 ELSE NULL END;
  IF v_daily_rate IS NULL THEN
    RAISE EXCEPTION 'Invalid duration. Choose 30 or 60 days.';
  END IF;

  v_daily_payout := round(p_amount * v_daily_rate, 2);

  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE id = v_user_id;

  INSERT INTO investments (user_id, car_id, car_name, car_image_url, investment_amount, duration_days, daily_payout, status, start_date, last_payout_date)
  VALUES (v_user_id, p_car_id, v_car.car_name, v_car.image_url, p_amount, p_duration_days, v_daily_payout, 'active', now(), now())
  RETURNING id INTO v_investment_id;

  INSERT INTO audit_logs (user_id, action, details)
  VALUES (v_user_id, 'investment_created', format('Car: %s, Amount: %s, Duration: %s days', v_car.car_name, p_amount, p_duration_days));

  RETURN v_investment_id;
END;
$$;

-- ============================================================
-- 2. Update standalone check_investment_limit for consistency
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_investment_limit(p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount < 300 THEN
    RAISE EXCEPTION 'Minimum investment amount is 300 PHP';
  END IF;
  IF p_amount > 75000 THEN
    RAISE EXCEPTION 'Maximum investment amount is 75,000 PHP';
  END IF;
  RETURN true;
END;
$$;

-- ============================================================
-- 3. Update withdrawal_referrals_required tier logic
-- ============================================================
CREATE OR REPLACE FUNCTION public.withdrawal_referrals_required(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prior integer;
BEGIN
  SELECT count(*) INTO v_prior
  FROM withdrawal_logs
  WHERE user_id = p_user_id AND status <> 'rejected';

  RETURN CASE
    WHEN v_prior = 0 THEN 1
    WHEN v_prior = 1 THEN 2
    WHEN v_prior = 2 THEN 3
    WHEN v_prior = 3 THEN 4
    ELSE 5
  END;
END;
$$;

-- ============================================================
-- 4. Update check_withdrawal_eligibility to use recharge-based qualification
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_withdrawal_eligibility(p_user_id uuid)
RETURNS TABLE(eligible boolean, total_referrals integer, qualified_referrals integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_referrals integer;
  v_qualified_referrals integer;
  v_required integer;
BEGIN
  SELECT count(*) INTO v_total_referrals
  FROM profiles p
  WHERE p.referred_by = p_user_id;

  SELECT count(DISTINCT p.id) INTO v_qualified_referrals
  FROM profiles p
  INNER JOIN recharge_logs r ON r.user_id = p.id AND r.status = 'approved' AND r.amount >= 500
  WHERE p.referred_by = p_user_id;

  v_required := public.withdrawal_referrals_required(p_user_id);

  RETURN QUERY SELECT (v_qualified_referrals >= v_required), v_total_referrals, v_qualified_referrals;
END;
$$;

-- ============================================================
-- 5. Update enforce_withdrawal_eligibility trigger message
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_withdrawal_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eligible boolean;
  v_qualified integer;
  v_required integer;
BEGIN
  SELECT eligible, qualified_referrals INTO v_eligible, v_qualified
  FROM public.check_withdrawal_eligibility(New.user_id);

  v_required := public.withdrawal_referrals_required(New.user_id);

  IF NOT v_eligible THEN
    RAISE EXCEPTION 'This withdrawal requires % qualified referral(s) who each recharged at least 500 PHP', v_required;
  END IF;

  IF New.amount < 500.00 THEN
    RAISE EXCEPTION 'Minimum withdrawal is 500 PHP';
  END IF;

  RETURN New;
END;
$$;

-- ============================================================
-- 6. Referral bonus trigger — credits referrer 0.5% on approved recharge
-- ============================================================
CREATE OR REPLACE FUNCTION public.credit_referral_bonus_on_recharge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_code text;
  v_bonus numeric;
  v_referral_name text;
BEGIN
  -- Only trigger when status changes TO 'approved'
  IF (TG_OP = 'UPDATE' AND OLD.status <> 'approved' AND NEW.status = 'approved') OR
     (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN

    -- Find the referrer of the user who recharged
    SELECT referred_by INTO v_referrer_id
    FROM profiles
    WHERE id = NEW.user_id;

    IF v_referrer_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Bonus = 0.5% of recharge amount (minimum)
    v_bonus := round(NEW.amount * 0.005, 2);

    IF v_bonus > 0 THEN
      -- Credit the referrer's wallet
      UPDATE profiles
      SET wallet_balance = wallet_balance + v_bonus
      WHERE id = v_referrer_id;

      -- Get referral's name for the audit log
      SELECT full_name INTO v_referral_name
      FROM profiles
      WHERE id = NEW.user_id;

      -- Log the bonus
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (
        v_referrer_id,
        'referral_bonus_credited',
        format('Referral bonus: %s PHP from %s recharge of %s PHP', v_bonus, v_referral_name, NEW.amount)
      );

      -- Notify the referrer
      INSERT INTO admin_notifications (event_type, title, message, entity_id, user_id)
      VALUES (
        'recharge',
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

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS referral_bonus_on_recharge ON recharge_logs;
CREATE TRIGGER referral_bonus_on_recharge
  AFTER INSERT OR UPDATE OF status ON recharge_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_referral_bonus_on_recharge();

-- Revoke execute from anon/public, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.credit_referral_bonus_on_recharge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_referral_bonus_on_recharge() TO authenticated;
