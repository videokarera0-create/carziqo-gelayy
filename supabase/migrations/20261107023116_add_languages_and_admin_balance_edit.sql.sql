/*
# Add more languages + admin balance edit function

1. Changes
- Expand the `profiles.language` CHECK constraint to support 8 languages:
  English, Filipino, Spanish, French, Arabic, Portuguese, Hindi, Chinese.
- Create `admin_set_user_balance(p_user_id uuid, p_new_balance numeric)` —
  a SECURITY DEFINER function that lets an admin set any user's wallet balance.
  The function checks that the CALLER (derived from auth.uid()) has role='admin',
  validates the new balance is non-negative, updates the balance, and logs the
  action to audit_logs.

2. Security
- The function is SECURITY DEFINER with a fixed search_path.
- EXECUTE is revoked from PUBLIC and anon, granted only to authenticated.
- The admin check derives the caller from auth.uid() — never from a parameter.
- wallet_balance is already column-restricted (users cannot update it directly),
  so this function is the only path to change a balance outside of the daily
  credit / recharge / withdrawal flows.
*/

-- 1. Expand language CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_language_check
  CHECK (language IN ('en', 'fil', 'es', 'fr', 'ar', 'pt', 'hi', 'zh'));

-- 2. Admin balance edit function
CREATE OR REPLACE FUNCTION public.admin_set_user_balance(p_user_id uuid, p_new_balance numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_balance numeric;
  v_user_name text;
BEGIN
  -- Authorize the CALLER (derived from session, never a parameter)
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate input
  IF p_new_balance IS NULL OR p_new_balance < 0 THEN
    RAISE EXCEPTION 'Balance must be a non-negative number';
  END IF;

  -- Get current balance and name for audit log
  SELECT wallet_balance, full_name INTO v_old_balance, v_user_name
  FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update the balance
  UPDATE profiles
  SET wallet_balance = p_new_balance
  WHERE id = p_user_id;

  -- Log the action
  INSERT INTO audit_logs (user_id, action, details)
  VALUES (
    p_user_id,
    'admin_balance_edit',
    'Balance changed from ' || v_old_balance || ' to ' || p_new_balance || ' by admin'
  );
END;
$$;

-- Lock down execution: only authenticated (admin check is inside the function)
REVOKE EXECUTE ON FUNCTION public.admin_set_user_balance(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_balance(uuid, numeric) TO authenticated;
