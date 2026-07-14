# Repository instructions

- Never add real faculty, real reviews, allegations, personal contact data, production credentials, or identifying creator metadata.
- Keep demo data explicitly fictional and preserve the visible demo disclosure.
- Public browser reads must use the safe RPCs; do not grant browser roles direct table access.
- Public writes must use authenticated Edge Functions, server validation, Turnstile, rate limiting, and typed envelopes.
- Do not weaken RLS, expose service-role keys, enable production source maps, or add tracking without an explicit security review.
- Add migrations instead of changing an undocumented production database.
- Run lint, typecheck, unit tests, build, privacy scan, and relevant database/Edge tests before publishing.
