-- Migration: 002_create_events

CREATE TYPE "enum_events_status" AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE "enum_events_theme" AS ENUM ('confetti', 'elegant', 'neon');

CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug              VARCHAR(200) NOT NULL UNIQUE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  event_date        TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end_date    TIMESTAMP WITH TIME ZONE,
  location_name     VARCHAR(255),
  location_address  TEXT,
  location_lat      FLOAT,
  location_lng      FLOAT,
  cover_image_url   VARCHAR(500),
  theme             "enum_events_theme" NOT NULL DEFAULT 'confetti',
  max_guests        INTEGER,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  rsvp_deadline     TIMESTAMP WITH TIME ZONE,
  status            "enum_events_status" NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_host_id ON events (host_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events (slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
