BEGIN;
ALTER TABLE hackloop.events ADD COLUMN IF NOT EXISTS prize_pool text;
ALTER TABLE hackloop.events ADD COLUMN IF NOT EXISTS cover_image bytea;
ALTER TABLE hackloop.events ADD COLUMN IF NOT EXISTS cover_image_media_type text;
INSERT INTO hackloop.feature_migrations(version) VALUES ('20261106_event_cover_prize') ON CONFLICT DO NOTHING;
COMMIT;
