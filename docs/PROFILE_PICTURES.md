Profile pictures
================

Run backend/sql/profile_avatars.sql against the existing database before starting
the updated backend. The migration is additive and safe to run more than once.

Participants can upload or remove a PNG, JPEG or WebP picture from My Profile.
Images are limited to 5 MB. The server stores them separately from profile JSON.
Picture downloads require authentication and are limited to the owner and active
teammates. The chat and team member list display pictures with initials as fallback.

No API keys or environment-variable changes are required.
