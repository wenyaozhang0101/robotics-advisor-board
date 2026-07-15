# Database setup

Install the Supabase CLI and Docker, then run:

```bash
supabase start
supabase db reset
supabase test db
```

The reset applies `supabase/migrations` and the fictional local seed. Never place production reviewer data in `seed.sql`, database exports, screenshots, or source control.

## Production migration

Link only after creating a neutral Supabase project. Review the SQL, then use `supabase db push`. Verify that every exposed table has RLS, browser roles cannot select raw rows, and the three public RPCs omit identity/moderation fields. Add administrator UUIDs directly through an audited administrative SQL session; never store administrator emails in frontend code.
