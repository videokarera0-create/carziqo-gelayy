/*
# Add real-time chat between users and admins

1. New Tables
- `chat_messages`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles.id ON DELETE CASCADE) — the user in the conversation
  - `sender_id` (uuid, references profiles.id ON DELETE CASCADE) — who sent the message
  - `sender_role` (text, 'user' or 'admin') — role of sender
  - `content` (text, not null) — message text
  - `is_read` (boolean, default false) — whether the recipient has read it
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `chat_messages`.
- Grant CRUD to `authenticated` only (app requires sign-in).
- Users can SELECT/INSERT their own conversation messages (where user_id = auth.uid()).
- Admins can SELECT all messages and INSERT replies to any user conversation.
- Users can UPDATE is_read on their own conversation messages.
- Admins can UPDATE is_read on all messages.
- Enable realtime publication for chat_messages.

3. Indexes
- Index on user_id + created_at for conversation ordering.
- Index on is_read + sender_role for unread queries.
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'admin')),
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(is_read, sender_role) WHERE is_read = false;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;

-- Users: read all messages in their own conversation
DROP POLICY IF EXISTS "select_own_conversation" ON chat_messages;
CREATE POLICY "select_own_conversation"
ON chat_messages FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Users: insert messages into their own conversation
DROP POLICY IF EXISTS "insert_own_conversation" ON chat_messages;
CREATE POLICY "insert_own_conversation"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND sender_id = auth.uid() AND sender_role = 'user')
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Users: mark messages as read in their own conversation
-- Admins: mark any message as read
DROP POLICY IF EXISTS "update_read_status" ON chat_messages;
CREATE POLICY "update_read_status"
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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
