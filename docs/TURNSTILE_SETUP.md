# Turnstile setup

Create separate Cloudflare Turnstile widgets for local/staging and production. Restrict the production widget to the final custom hostname. Configure the public site key as `VITE_TURNSTILE_SITE_KEY` and the secret only as `TURNSTILE_SECRET_KEY` in Supabase.

Every public write sends the token to its Edge Function. The backend calls Siteverify, requires the expected action, checks the returned hostname when configured, and treats timeout, replay, network failure, or mismatch as failure. The application does not send or store IP addresses.

Use Cloudflare's published dummy keys for automated tests. Never allow test keys or localhost in the production widget.
