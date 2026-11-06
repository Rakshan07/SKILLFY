# Local database setup

The active website uses FastAPI on port 8000, PostgreSQL's hackloop schema, and
the frontend at http://localhost:5174. The earlier Node database-check server
and its npm scripts are legacy and are not the current application flow.

See the repository [README](../README.md#local-setup-on-windows) for configuration,
migration order, startup commands, OAuth callbacks, and testing precautions.

Existing installations must apply missing additions rather than rerun the base
schema. This release adds backend/sql/event_cover_prize.sql and
backend/sql/profile_avatars.sql after the previous account/assessment migrations.

Keep credentials in a gitignored root .env. Database records and uploaded
pictures remain in PostgreSQL and are not included when pushing source code.
