-- Add 'bot' as a valid sender_role so an AI assistant can reply to simple user
-- questions before they reach the admin. Bot messages are inserted by the user's
-- own client (they are the user's conversation), so we allow users to insert
-- bot messages on their own conversation.

-- 1. Relax the CHECK constraint to include 'bot'.
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role IN ('user', 'admin', 'bot'));

-- 2. Update the INSERT policy so the user can also insert bot messages on their
--    own conversation (sender_id is the user themselves; the bot is a client-side
--    assistant running in the user's session).
DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND sender_id = auth.uid() AND sender_role IN ('user', 'bot'))
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 3. Update the UPDATE policy so users can mark bot messages as read too
--    (they already can mark admin messages as read).
DROP POLICY IF EXISTS "update_chat_messages" ON chat_messages;
CREATE POLICY "update_chat_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
