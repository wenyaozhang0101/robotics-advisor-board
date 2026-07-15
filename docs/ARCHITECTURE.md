# Architecture

```text
GitHub Pages (React/Vite)
  ├─ safe public RPCs ──> Supabase PostgreSQL
  ├─ anonymous Auth JWT ─> Supabase Auth
  └─ authenticated writes ─> Edge Functions
       ├─ schema + relationship validation
       ├─ Cloudflare Turnstile Siteverify
       ├─ atomic user rate limits
       ├─ HMAC faculty-scoped aliases
       └─ service-role database writes
```

Demo mode uses local fictional fixtures and never calls write services. Live mode fails visibly and never substitutes fixtures after backend errors.

Raw tables use RLS and have no browser grants. `get_faculty_rankings`, `get_faculty_detail`, and `get_public_reviews` are security-definer RPCs with empty search paths and explicit safe JSON fields. Only approved faculty/reviews enter public results.

Reviewers use anonymous Supabase users. Their UUID is used only internally. An HMAC-derived alias is stable within one faculty profile and different across faculty profiles. Administrators use non-anonymous Auth users listed in `admin_roles`. Moderation status changes and append-only events are transactional.
