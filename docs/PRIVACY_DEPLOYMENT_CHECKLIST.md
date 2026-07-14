# Mandatory privacy deployment checklist

Production is blocked until an owner manually confirms every item:

- [ ] Create a neutral GitHub Organization or separate neutral deployment account unrelated to existing identities.
- [ ] Recreate the sanitized source under that Organization; do not carry development `.git` history.
- [ ] Keep membership private where GitHub permits it.
- [ ] Enable GitHub email privacy, use the platform-provided noreply address, and block pushes exposing a private email.
- [ ] Purchase a neutral custom domain and enable WHOIS/domain-registration privacy.
- [ ] Create a role-based mailbox on the custom domain.
- [ ] Ensure DNS records do not reference a personal GitHub username; avoid wildcard records.
- [ ] Verify the domain at the Organization level before pointing traffic.
- [ ] Audit commit authors, repository metadata, Actions logs, README, screenshots, artifacts, and source bundles.
- [ ] Create neutral Supabase and Turnstile resources; store backend secrets only in their secret managers.
- [ ] Enable Pages and HTTPS only after privacy and backend smoke tests pass.

These measures reduce intentional public attribution; they do not guarantee legal, forensic, GitHub-level, registrar-level, or infrastructure-level anonymity. Account creation, domain purchase, WHOIS settings, DNS changes, service configuration, and legal review cannot be completed by source code.
