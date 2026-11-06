# Skillfy

Skillfy is a skill-based event and team formation platform. Participants discover opportunities, demonstrate relevant skills, and form teams with complementary roles. Verified organizers publish events and manage participation.

The application uses React, FastAPI, and PostgreSQL. The database and API are required for account, assessment, event, and team workflows.

## Features

### Accounts and profiles

- Google and GitHub sign-in, plus email signup with an emailed verification code.
- Password creation, email/password sign-in, and password-reset email links.
- Profile setup before entering the participant workspace.
- Personal details, optional documents, profile photos, contribution history, and recorded XP.
- Photo upload/removal under **My Profile → Edit profile**. Chat and member lists display photos, with initials as fallback.

### Participant workspace

- Personal overview with collaboration totals, assessment next steps, profile highlights, and XP progression.
- Explore Events with search, categories, posters, and highlighted prize pools.
- My Events with upcoming, in-progress, and completed views.
- Separate registration pages with category-specific roles, skills, and experience fields.
- Assessment and My Teams hubs with search, filters, real status information, and direct next actions.

### Organizers and administrators

- Organizer applications with institution, contact, qualification, and verification documents.
- Administrator review at /admin/organizer-review.
- Verification is required before publishing; events do not require another administrator approval.
- Single-page creation with title, category, description, rules, prizes, team size, dates, and optional poster.
- Organizer event management, participant rosters, teams, and recorded results/contributions.
- Organizer accounts cannot register for participant events or join participant teams.

### Assessments and matching

- Gemini-generated questions grounded in the event brief, participant skills, preferred role, and experience level.
- Category-aware formats: concise questions for music, debate, esports, and quizzes; practical case studies where appropriate for technical events.
- Saved questions and answer drafts, evaluation against private rubrics, and complementary-role matching.
- Bounded retries/model fallback for temporary outages. Provider limits can still prevent completion; the app does not fabricate successful AI results.
- Assessments estimate readiness. Written music answers cannot establish instrumental or vocal performance.
- XP comes from eligible recorded event outcomes, not automatically from taking an assessment.

### Teams and chat

- Create a team, specify your role, recruit complementary roles, or request to join.
- Uppercase team names and plain Leader/Member labels.
- Persistent join-request feedback, duplicate prevention, leader approval, and capacity checks.
- Three-pane team room with artwork, general channel, members, history, search, and emoji insertion.
- @all and individual mentions with saved in-app notifications. The picker inserts unique member handles.
- WebSocket updates with polling fallback. Only active accepted members can access team chat.
- Profile-photo downloads require authentication and are limited to the owner and active teammates.
- Voice/video, file attachments, threads, and multiple custom chat channels are not implemented.

### Interface

Wisteria and apricot identity, light/dark modes, subtle neumorphic surfaces, animated photo introduction, interactive authentication background, responsive forms, compact dashboards, poster/detail columns, and viewport-height chat. Field requirements, focus outlines, and empty/error states remain visible.

## Technology

| Layer | Implementation |
| --- | --- |
| Frontend | React, Vite, React Router |
| Styling | Tailwind CSS, shared CSS tokens, Lucide icons |
| Motion | CSS/WebGL and threejs-components |
| Backend | Python, FastAPI, Uvicorn |
| Database | PostgreSQL, SQLAlchemy, psycopg; hackloop schema |
| Authentication | Hashed session tokens, Argon2 passwords, provider OAuth |
| AI | Google Gen AI SDK with configured Gemini models |
| Email | SMTP verification codes and password-reset links |
| Tests | pytest and FastAPI TestClient |

## Local setup on Windows

Use Node.js 22.12+ or a compatible newer release, Python 3.12+, and PostgreSQL. The installed schema was tested with PostgreSQL 18. pgAdmin manages the database; the website connects to PostgreSQL itself.

### 1. Get the code

    git clone https://github.com/Rakshan07/Berojgar-co.git
    cd Berojgar-co
    git switch website-interface
    npm.cmd install
    py -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r backend/requirements-live.txt

For the published main branch, use git switch main instead.

### 2. Configure the backend

For a new checkout only:

    Copy-Item .env.example .env

If .env already exists, merge missing settings rather than replacing your passwords or keys. Edit the **root .env beside package.json**:

- PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD: local PostgreSQL connection.
- PUBLIC_APP_URL=http://localhost:5174.
- SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_SSL: outgoing mail.
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: Google OAuth credentials.
- GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET: GitHub OAuth credentials.
- GEMINI_API_KEY, AI_MODEL, optional AI_FALLBACK_MODELS: assessments.

Database passwords are local to each developer. SMTP app passwords, OAuth secrets, and API keys are server-side credentials; never prefix them with VITE_.

The backend also reads backend/.env and backend/.env.local. Root .env takes precedence for nonempty duplicate values. Prefer one root file for local configuration.

### 3. Prepare the database

Create a database named hackloop in pgAdmin or PostgreSQL.

**New empty database only:** run backend/sql/installed_base_schema.sql, then these additions in order:

1. backend/sql/dashboard_additions.sql
2. backend/sql/profile_onboarding.sql
3. backend/sql/password_reset.sql
4. backend/sql/organizer_documents.sql
5. backend/sql/social_login.sql
6. backend/sql/email_verified_signup.sql
7. backend/sql/event_assessment_teaming_chat.sql
8. backend/sql/event_cover_prize.sql
9. backend/sql/profile_avatars.sql

Open each file in pgAdmin Query Tool against the same database, or use psql:

    psql -U postgres -d hackloop -v ON_ERROR_STOP=1 -f backend/sql/installed_base_schema.sql

Repeat with each addition's filename.

**Existing installation:** do not rerun the base schema or recreate the database. Apply missing additions only. If the previous assessment/team release is installed, this update needs event_cover_prize.sql and profile_avatars.sql. Both are additive and repeatable.

Do not run seed_demo.sql to initialize real user workflows. The API does not automatically apply migrations or create demo accounts.

### 4. Start the backend

Terminal 1, inside the repository:

    .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

Keep it running. Stop with **Ctrl+C** before restarting.

### 5. Start the frontend

Terminal 2, inside the same repository:

    npm.cmd run dev

Open **http://localhost:5174**. Vite proxies /api to port 8000 and uses a strict frontend port.

Refresh after frontend edits. Restart the backend after Python or .env changes. Apply database additions before using features that need them.

- Website: http://localhost:5174
- Health: http://127.0.0.1:8000/health
- API docs: http://127.0.0.1:8000/docs

## Google, GitHub, email, and AI

### Google

Create a web OAuth client in Google Auth Platform:

    Authorized JavaScript origin:
    http://localhost:5174

    Authorized redirect URI:
    http://localhost:5174/api/v1/auth/oauth/google/callback

Store its ID and secret locally. For a consent application in testing, add permitted accounts as test users. The callback must match exactly, including hostname, port, path, and trailing slash.

### GitHub

Create an OAuth application:

    Homepage:
    http://localhost:5174

    Authorization callback URL:
    http://localhost:5174/api/v1/auth/oauth/github/callback

Store its client ID and secret in root .env.

### SMTP

The existing Gmail setup uses smtp.gmail.com, port 587, SMTP_USE_SSL=false, and an app password as SMTP_PASSWORD. Do not use the normal account password. SMTP_FROM must be an address the account can send from.

Each developer needs working local credentials. They are not included when cloning or pulling.

### Gemini

Create a key through Google AI Studio and set GEMINI_API_KEY locally. AI_MODEL must name a model available to that key. AI_FALLBACK_MODELS accepts comma-separated alternatives for temporary outages. Availability, quotas, and pricing depend on the provider; unlimited or permanently free service is not guaranteed.

## Administrator access

Only accounts with a server-side admin role can review organizers. An email address alone does not grant admin access.

A trusted database administrator can grant the role to an existing account:

    INSERT INTO hackloop.user_roles (user_id, role)
    SELECT id, 'admin'
    FROM hackloop.users
    WHERE lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL')
    ON CONFLICT DO NOTHING;

Check the intended account exists, sign in again, and open /admin/organizer-review. Never grant access from browser state or a public role field.

## Build and validation

    npm.cmd run build
    npm.cmd run preview

Preview serves the built frontend; the API still needs to run. OAuth is configured for localhost:5174. Preview on another port requires matching provider/environment settings.

Backend tests require a **separate disposable PostgreSQL database** with the migrations above. Configure TEST_DATABASE_URL and matching PG* values for that database before running:

    .\.venv\Scripts\python.exe -m pytest backend/tests_live -q

Never point integration tests at real user accounts. This update passed a production build and 35 backend tests in a disposable database, including join approval, mention privacy/idempotency, and profile-picture permissions.

## Repository structure

| Path | Purpose |
| --- | --- |
| src/pages/public | Landing, authentication, onboarding, admin review |
| src/workspace | Dashboards, events, assessments, teams, chat, profile |
| src/components | Shared UI, authentication and landing components |
| src/theme.css | Light/dark tokens |
| src/neumorphism.css | Theme-aware surface styling |
| backend/app/live | Routes used by backend.app.main |
| backend/sql | Base schema and additive migrations |
| backend/tests_live | Integration/provider tests |
| docs | Supporting setup and feature notes |

Earlier prototype modules and a legacy Node database-check server remain in the repository. The active website uses the FastAPI entry point above.

## Security and deployment

- Commit placeholder .env.example, never actual .env files, .venv, caches, node_modules, or dist.
- PostgreSQL records and uploaded pictures are not pushed by Git. Each teammate needs their own database and migrations.
- Organizer documents and private contact details are not public assets.
- Chat is access-controlled but not end-to-end encrypted.
- In-app notifications are not SMS, email, or operating-system push notifications.
- Production needs HTTPS, correct OAuth callbacks/origins, production app URL, restricted CORS, protected secrets, backups, and a persistent backend.
- The local Vite proxy and a running development terminal are not a production deployment.
