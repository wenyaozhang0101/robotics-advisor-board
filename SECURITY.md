# Security policy

Do not open public issues containing vulnerabilities, secrets, private review data, reporter identities, or moderation exports. Use `contact@example-domain.org` after the neutral role mailbox is configured.

## Supported version

Only the latest production commit is supported. This initial version is not production-approved until every privacy deployment checkpoint is complete.

## Security boundaries

- Browser configuration contains only a Supabase URL, publishable key, and Turnstile site key.
- Service-role, Turnstile secret, and pseudonym HMAC values exist only in Supabase secret management.
- Raw tables are denied to browser roles; safe RPCs expose approved data only.
- Administrator authorization comes from `admin_roles`, not an email or client flag.
- Operational logs must not contain review text, private notes, tokens, or reviewer identifiers unnecessarily.

Rotate affected secrets, preserve audit evidence, hide unsafe content, and follow `docs/INCIDENT_RESPONSE.md` after a suspected incident.
