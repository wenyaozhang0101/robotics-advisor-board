# Contributing

Use a focused branch and a draft pull request. Never add real-person demo fixtures or production secrets. New behavior needs tests for privacy, authorization, failure handling, accessibility, and responsive layouts where applicable.

Before requesting review, run:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:privacy
```

Database changes must be migrations with RLS and privilege review. Content-policy changes require moderation review. Commit authors should use an account-provided noreply address; production history must be created from the sanitized source under a neutral deployment account.
