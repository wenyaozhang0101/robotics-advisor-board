# GitHub Pages deployment

The production workflow runs only on the `production` branch or manual dispatch. It installs the lockfile, runs lint/typecheck/tests, builds without source maps, performs the privacy scan, uploads a Pages artifact, and deploys with minimum permissions.

## Manual activation

1. Recreate the audited source in a neutral Organization repository; do not transfer the personal development history.
2. Set Pages source to GitHub Actions and protect the `github-pages` environment.
3. Add repository variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_TURNSTILE_SITE_KEY`; add `PRIVACY_FORBIDDEN_STRINGS` as an Actions secret containing comma-separated identifiers that must never enter source or bundles.
4. Create/push `production` only after backend smoke tests pass.
5. Verify the artifact and deployed bundle again before enabling live submissions.

The default project URL exposes the Organization name and repository name. A personal-account project URL is not anonymous. GitHub Pages itself may retain visitor IP data for security.
