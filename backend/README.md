# Skillfy backend

The active API entry point is **backend.app.main:app**. It uses FastAPI,
SQLAlchemy, psycopg and the PostgreSQL hackloop schema.

See the root [README](../README.md) for the complete setup, migration order,
provider configuration, administrator access, and test instructions.

## Start locally

From the repository root, after creating the virtual environment and installing
backend/requirements-live.txt:

    .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

The frontend runs separately at http://localhost:5174.

## Configuration

Use a gitignored root .env, copied from the root .env.example for a new checkout.
Keep database credentials, SMTP app passwords, OAuth secrets, and Gemini keys
local. Never paste connection strings with passwords into documentation.

## Database

New databases use backend/sql/installed_base_schema.sql followed by the additions
listed in the root README. Existing installations apply missing additions only;
do not rerun the base schema against real data.

This interface release adds event_cover_prize.sql and profile_avatars.sql.

The API never automatically runs seed data or bootstrap migrations.

## Tests

Use a separate disposable PostgreSQL database and configure TEST_DATABASE_URL
and matching PG* values before running backend/tests_live. Never use the live
account database for integration tests.

## Credential exposure

If any credential was previously committed, remove it from current files and
rotate it at its issuing service. Deleting a file does not remove earlier Git
history. History cleanup requires coordinated repository maintenance.
