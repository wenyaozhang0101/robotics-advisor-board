# Supabase setup

Manual production steps:

1. Create a neutral Supabase organization/project and choose an appropriate North American region and retention policy.
2. Enable anonymous sign-ins and configure the production site URL and exact redirect URLs.
3. Apply migrations and run pgTAP tests.
4. Deploy `submit-review`, `submit-report`, `request-faculty`, and `moderate-content` with JWT verification enabled.
5. Add secrets: `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES`, `PSEUDONYM_HMAC_SECRET`, and `ALLOWED_ORIGINS`. Supabase supplies its URL, anonymous key, and service-role value to functions.
6. Add administrators by Auth UUID to `admin_roles`; test denial with an ordinary and an anonymous user.
7. Put only the project URL and publishable key in GitHub repository variables.

Do not enable live mode until pending/rejected reviews are proven unreadable and the moderation queue is staffed.
