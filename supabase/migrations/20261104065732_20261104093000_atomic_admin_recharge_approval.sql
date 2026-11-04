/*
# Make WAYMO Recharge Approval Atomic

1. Purpose
- Ensures an administrator approval credits a user's wallet exactly once.
- Prevents two administrators approving the same pending recharge at the same time.

2. Modified Database Behavior
- `approve_recharge(uuid)` now claims the pending recharge through one conditional UPDATE.
- The wallet credit happens only after that pending claim succeeds.
- A second approval attempt receives a safe not-pending error and cannot add another credit.

3. Security
- Approval remains restricted to administrators through `is_admin()`.
- The function remains SECURITY DEFINER with a fixed search path.
- Existing authenticated EXECUTE access is preserved for the admin screen; anonymous access remains denied.

4. Data Safety
- No rows, columns, or tables are removed.
- Existing approved, rejected, and pending recharge records are preserved.
*/

CREATE OR REPLACE FUNCTION public.approve_recharge(p_recharge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id uuid;
  v_amount numeric(12,2);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can review recharges';
  END IF;

  UPDATE public.recharge_logs
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_recharge_id AND status = 'pending'
  RETURNING user_id, amount INTO v_user_id, v_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recharge not found or not pending';
  END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + v_amount
  WHERE id = v_user_id;

  PERFORM public.log_action(v_user_id, 'recharge_approved',
    'Amount: ' || v_amount || ' approved by admin');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_recharge(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_recharge(uuid) TO authenticated;