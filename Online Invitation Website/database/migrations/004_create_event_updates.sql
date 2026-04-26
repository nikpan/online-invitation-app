-- Migration: 004_create_event_updates

CREATE TABLE IF NOT EXISTS event_updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  send_email  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_updates_event_id ON event_updates (event_id);
