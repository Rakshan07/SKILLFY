# Simplified event creation

Approved organizers create and publish events directly. Administrator review applies to organizer verification, not each event.

The single-page form collects the title/category, description, rules, prize pool, optional raster event image, and the three registration/event dates. Team size defaults to 2–5. Venue and participation instructions belong in the description.

Run backend/sql/event_cover_prize.sql once on each existing installation, after the previous migrations. It adds prize metadata and image storage without changing existing event records. Restart the backend and refresh the frontend.

Images accept PNG/JPEG/WebP up to 5 MB. Only the event owner with approved organizer access can upload; images become public after publication. Cards and event details show the same stored image.

Validation: production build and 35 isolated backend tests, including prize persistence, image retrieval, upload ownership and private draft images. Local tests used a verified isolated sniffio dependency because the existing virtual environment package was unreadable.
