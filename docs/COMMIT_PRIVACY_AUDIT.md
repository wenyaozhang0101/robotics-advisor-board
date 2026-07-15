# Commit privacy audit

The development repository is owned by a personal account and therefore is not identity-private, regardless of neutral file contents. The initial local commits use the neutral display `Advisor Signal Maintainers` and placeholder `contact@example-domain.org`; this is not a verified GitHub noreply identity and must not become production history.

Inspect all refs with:

```bash
git log --format='%h %an <%ae>' --all
git remote -v
```

Production must be recreated from a scanned source archive without `.git`, then committed by the neutral deployment account using its GitHub-provided noreply email. Do not rewrite or claim to sanitize already published history without explicit approval.
