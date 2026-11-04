/*
# Allow users to read their own admin_notifications

## Problem
The admin_notifications table currently only allows admins to read notifications (via is_admin() check).
But referral bonus notifications are addressed to regular users (user_id = the referrer).
Users need to be able to read their own notifications to see referral bonus history.

## Changes
- Add a SELECT policy allowing authenticated users to read notifications where user_id = auth.uid()
- Add an UPDATE policy allowing users to mark their own notifications as read
- These are additive — the existing admin policies remain unchanged
- Grant SELECT and UPDATE on admin_notifications to authenticated (already granted, but reaffirmed)
*/

GRANT SELECT, UPDATE ON admin_notifications TO authenticated;

DROP POLICY IF EXISTS "users_select_own_notifications" ON admin_notifications;
CREATE POLICY "users_select_own_notifications"
ON admin_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_notifications" ON admin_notifications;
CREATE POLICY "users_update_own_notifications"
ON admin_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
