# Custom domain setup

This is a blocking manual procedure:

1. Purchase a neutral domain with WHOIS privacy and create `contact@…` as a role mailbox.
2. In Organization Pages settings, add the domain and publish the requested DNS TXT verification record. Keep it in place.
3. In repository Pages settings, add the desired custom hostname **before** directing traffic.
4. Configure an apex ALIAS/ANAME/A record or a subdomain CNAME to the neutral Organization Pages hostname. Never use wildcard DNS and never point at a personal GitHub username.
5. Wait for DNS and certificate issuance, verify with `Resolve-DnsName`, enable HTTPS, and test apex/`www` redirects.
6. Update Supabase redirect URLs, `ALLOWED_ORIGINS`, and Turnstile hostnames to the final hostname.

Actions-based Pages ignores a repository `CNAME` file; repository Pages settings are the source of truth. Remove DNS immediately if Pages is disabled to reduce takeover risk.
