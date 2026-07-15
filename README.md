# Advisor Signal

Advisor Signal is a privacy-conscious, community-sourced platform for reviewing robotics PhD advising experiences in North America. Its public heading is **Mental Health Is All You Need**.

> Status: demonstration and production foundation. Do not publish real-person profiles or reviews until backend configuration, moderation staffing, privacy checks, and legal review are complete.

## What is included

- Responsive bilingual recommendation and caution leaderboards
- Search, filtering, faculty details, anonymous review, reports, and faculty requests
- Read-only moderation demonstration and protected live administrator flow
- Supabase migrations, RLS-safe public RPCs, anonymous authentication, and Edge Functions
- Cloudflare Turnstile server verification and user-based rate limiting
- GitHub Actions CI and GitHub Pages deployment

All bundled demonstration people, institutions, and reviews are fictional.

## Local development

Requirements: Node.js 22 and npm 10 or newer.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

`VITE_APP_MODE=demo` never writes submissions. Live mode requires the public Supabase URL/publishable key and Turnstile site key; backend secrets belong only in Supabase secret management.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:privacy
npx playwright install chromium
npm run test:e2e
supabase test db
deno test supabase/functions/_shared/schemas_test.ts
```

See [architecture](docs/ARCHITECTURE.md), [Supabase setup](docs/SUPABASE_SETUP.md), [deployment](docs/GITHUB_PAGES_DEPLOYMENT.md), and the mandatory [privacy deployment checklist](docs/PRIVACY_DEPLOYMENT_CHECKLIST.md).

## Safety and privacy limitations

Anonymous reports can be incomplete, biased, or false. Approval does not verify every claim. GitHub Pages, Supabase, Cloudflare, DNS providers, and network operators may keep infrastructure logs. The project minimizes application-level collection but does not promise legal, forensic, or provider-level anonymity.

Security reports and correction requests use the placeholder `contact@example-domain.org` until a neutral domain mailbox exists. There are no personal credits, analytics, visitor counters, or production secrets in this repository.
