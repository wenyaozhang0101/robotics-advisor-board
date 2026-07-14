# Incident response

## Triage

1. Preserve timestamps, request IDs, affected versions, and minimal non-content logs.
2. Hide affected public content and, if necessary, disable live writes without deleting evidence.
3. Determine whether identities, credentials, private moderation data, or availability were affected.

## Containment and recovery

- Rotate exposed Supabase, Turnstile, HMAC, GitHub, or DNS credentials through their providers.
- Revoke compromised administrator sessions/roles and inspect append-only moderation events.
- Patch through a reviewed migration or branch; rerun security, privacy, database, and bundle scans.
- Restore public access only after RLS and authorization tests pass.

## Follow-up

Notify affected parties and providers when legally or contractually required. Record decisions privately, minimize retained personal data, and obtain legal advice for breach notification, defamation, harassment, or serious allegations. Do not publish reviewer identities during incident communication.
