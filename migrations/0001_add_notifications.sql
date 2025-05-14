CREATE TYPE "notification_type" AS ENUM ('transaction', 'account', 'security', 'marketing', 'system', 'verification');
CREATE TYPE "notification_priority" AS ENUM ('low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" notification_type NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT FALSE,
  "priority" notification_priority NOT NULL DEFAULT 'medium',
  "related_entity_type" TEXT,
  "related_entity_id" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "expires_at" TIMESTAMP
);

-- Create index for faster notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Notify function for real-time notifications
CREATE OR REPLACE FUNCTION notify_new_notification() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_notification', json_build_object(
    'user_id', NEW.user_id,
    'notification_id', NEW.id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notification events
CREATE TRIGGER trigger_new_notification
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION notify_new_notification();
