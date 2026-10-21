CREATE TABLE IF NOT EXISTS dispatch_messages (
  id BIGSERIAL PRIMARY KEY,
  room TEXT NOT NULL DEFAULT 'dispatch',
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dispatch_messages_room_created_idx ON dispatch_messages (room, created_at DESC);
CREATE TABLE IF NOT EXISTS rider_locations (
  rider_id TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
