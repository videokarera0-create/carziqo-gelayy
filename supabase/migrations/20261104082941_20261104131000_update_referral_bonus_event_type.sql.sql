/*
# Update referral bonus trigger to use 'referral_bonus' event type

## Changes
- Updates credit_referral_bonus_on_recharge() to use event_type = 'referral_bonus' 
  instead of 'recharge' for the admin notification inserted for the referrer.
- This makes it easy to distinguish referral bonus notifications from regular recharge notifications.
*/

CREATE OR REPLACE FUNCTION public.credit_referral_bonus_on_recharge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_bonus numeric;
  v_referral_name text;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status <> 'approved' AND NEW.status = 'approved') OR
     (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN

    SELECT referred_by INTO v_referrer_id
    FROM profiles
    WHERE id = NEW.user_id;

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

REVOKE EXECUTE ON FUNCTION public.credit_referral_bonus_on_recharge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_referral_bonus_on_recharge() TO authenticated;
