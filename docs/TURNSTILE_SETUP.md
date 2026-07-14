# Turnstile setup

Create separate Cloudflare Turnstile widgets for local/staging and production. While the free GitHub Pages URL is in use, restrict the production widget to `advisor-signal-project.github.io` (hostname only; do not include the scheme or `/advisor-signal/` path). Replace that hostname after a custom domain is configured. Configure the public site key as `VITE_TURNSTILE_SITE_KEY` and the secret only as `TURNSTILE_SECRET_KEY` in Supabase.

The SPA renders widgets explicitly with actions `submit_review`, `submit_report`, and `request_faculty`. Every public write sends the token to its Edge Function. The backend calls Siteverify, requires the expected action, checks the returned hostname when configured, and treats timeout, replay, network failure, or mismatch as failure. The application does not send or store IP addresses.

Use Cloudflare's published dummy keys for automated tests. Never allow test keys or localhost in the production widget.
