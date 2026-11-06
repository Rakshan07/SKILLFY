BEGIN;
CREATE TABLE IF NOT EXISTS hackloop.profile_avatars (
  user_id uuid PRIMARY KEY REFERENCES hackloop.users(id) ON DELETE CASCADE,
  image_data bytea NOT NULL,
  media_type text NOT NULL CHECK(media_type IN ('image/png','image/jpeg','image/webp')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO hackloop.feature_migrations(version) VALUES ('20261106_profile_avatars') ON CONFLICT DO NOTHING;
COMMIT;
