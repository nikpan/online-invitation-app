-- Migration: 003_create_guests

CREATE TYPE "enum_guests_rsvp_status" AS ENUM ('pending', 'attending', 'declined', 'maybe');

CREATE TABLE IF NOT EXISTS guests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(50),
  rsvp_status  "enum_guests_rsvp_status" NOT NULL DEFAULT 'pending',
  adult_count  INTEGER NOT NULL DEFAULT 1,
  kid_count    INTEGER NOT NULL DEFAULT 0,
  edit_token   VARCHAR(128) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  rsvp_at      TIMESTAMP WITH TIME ZONE,
  message      TEXT,
  reminded_at  TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests (event_id);
CREATE INDEX IF NOT EXISTS idx_guests_edit_token ON guests (edit_token);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests (email);
