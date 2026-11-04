/*
# Fix admin_notifications event_type check constraint

## Problem
The admin_notifications table has a CHECK constraint on event_type that only allows
'signup', 'recharge', 'withdrawal'. But:
1. The chat notification trigger inserts event_type = 'chat' (added in a prior migration)
2. The referral bonus trigger inserts event_type = 'recharge' (which works, but a dedicated
   'referral_bonus' type would be clearer)

## Fix
Drop the old constraint and add a new one that includes all valid event types:
- signup
- recharge
- withdrawal
- chat
- referral_bonus

This is a non-destructive change — no data is lost, the constraint is simply widened.
*/

ALTER TABLE admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_event_type_check;

ALTER TABLE admin_notifications ADD CONSTRAINT admin_notifications_event_type_check
  CHECK (event_type = ANY (ARRAY['signup'::text, 'recharge'::text, 'withdrawal'::text, 'chat'::text, 'referral_bonus'::text]));
