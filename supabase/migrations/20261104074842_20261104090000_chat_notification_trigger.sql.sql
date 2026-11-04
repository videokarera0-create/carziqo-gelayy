/*
# Add chat message trigger for admin notifications

1. Changes
- Create a trigger function `notify_admin_on_user_chat` that inserts a row into admin_notifications
  whenever a user sends a chat message (sender_role = 'user').
- The notification includes the user's name and a preview of the message content.
- Attach the trigger to the chat_messages table AFTER INSERT.

2. Security
- The function runs as SECURITY DEFINER with a fixed search_path.
- REVOKE EXECUTE from PUBLIC and anon; GRANT EXECUTE to authenticated.
- The trigger fires on INSERT only when sender_role = 'user'.
*/

CREATE OR REPLACE FUNCTION public.notify_admin_on_user_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name text;
BEGIN
  IF NEW.sender_role = 'user' THEN
    SELECT full_name INTO v_user_name FROM profiles WHERE id = NEW.user_id;
    INSERT INTO admin_notifications (event_type, title, message, entity_id, user_id)
    VALUES (
      'chat',
      COALESCE(v_user_name, 'Unknown user') || ' sent a message',
      LEFT(NEW.content, 120),
      NEW.id,
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admin_on_user_chat() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_admin_on_user_chat() TO authenticated;

DROP TRIGGER IF EXISTS trg_notify_admin_chat ON chat_messages;
CREATE TRIGGER trg_notify_admin_chat
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_user_chat();
