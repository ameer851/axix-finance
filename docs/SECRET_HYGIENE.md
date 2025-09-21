# Secret Hygiene & Scanning

This project includes lightweight automation to prevent accidental credential exposure.

## Quick Commands

Run an on-demand scan (fails on high/critical findings):

```
npm run secret:scan
```

Expect a green check when no findings:

```
✅ No potential secrets detected.
```

If findings are detected you'll see lines like:

```
HIGH supabase-service-role server/example.ts:10 -> SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

The command exits non‑zero when any HIGH or CRITICAL issue is found.

## Patterns Detected

- Supabase service role key
- Supabase anon key (medium severity)
- JWT secrets
- Resend API key
- Private key PEM / SSH blocks
- AWS Access Key IDs
- Hard-coded password literals
- High-entropy base64 strings (info only)

Allow-listed: The example environment file `.env.example` may contain placeholders that match patterns; these are ignored.

## What To Do When A Secret Leaks

1. Immediately remove it from the repository (rewrite history if already pushed – `git filter-repo` / GitHub Secret Scanning guidance).
2. Revoke / rotate the credential in its issuing service.
3. Commit the removal & rotation notes (never commit the real secret again).
4. Add or adjust placeholders in `.env.example` if helpful.

## Pre-Commit Hook (Optional)

Create `.githooks/pre-commit`:

```
#!/usr/bin/env bash
npm run secret:scan || {
  echo "Secret scan failed – aborting commit" >&2
  exit 1
}
```

Make it executable and point git to it:

```
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

On Windows PowerShell users can execute the scan manually instead of a hook if desired.

## CI Integration (Example GitHub Action)

Add a job step:

```
- name: Secret scan
  run: npm run secret:scan
```

Failing the job blocks merges containing exposed secrets.

## Rationale

Even with `.gitignore` protections, accidents happen (copy/paste, ad-hoc test files). This scanner is lightweight, fast, and easy to extend—edit `scripts/scan-secrets.cjs` to refine patterns or severities.

## Extending Patterns

Add another entry to `patterns` in `scan-secrets.cjs` with fields:

```
{ id: 'stripe-secret', desc: 'Stripe secret key', regex: /sk_live_[0-9A-Za-z]{24,}/, severity: 'high' }
```

Then run the scan to validate.

## Limitations

- Not a substitute for professional tooling (GitHub Advanced Security, TruffleHog, gitleaks).
- Large binaries and >512KB files are skipped.
- High-entropy heuristic may yield false positives; treat as informational.

For stronger guarantees, layer an enterprise-grade scanner in CI alongside this script.

## Credential Rotation Steps (After Exposure)

Perform in this order to minimize blast radius:

1. Inventory exposed items: From scan output & git diff (e.g., SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, RESEND_API_KEY, SESSION_SECRET, DB password).
2. Suspend automation (optional): Temporarily disable scheduled jobs that rely on soon-to-rotate keys to avoid partial failures.
3. Rotate upstream credentials:

- Supabase: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` (also rotate anon if desired) → re-deploy.
- JWT: Generate new 32+ char random string; set `JWT_SECRET` in secret manager.
- Resend: Create new API key in dashboard; delete the leaked one.
- Database: Rotate DB user password; update connection string (Fly secret / Supabase config).
- Session / other keys: Replace with new random values.

4. Deploy with new secrets: `fly secrets set KEY=VALUE ...` or provider-specific command.
5. Invalidate old keys: Verify old keys no longer function.
6. Document rotation: Commit docs update (never the secrets) referencing date/time.
7. Monitor: Check logs & health endpoints for auth / connection errors post-rotation.

## Git History Purge Procedure

If secrets were committed previously, removing them in a later commit is insufficient—purge history:

1. Ensure all current working tree secrets are removed / replaced with placeholders.
2. Create a backup clone (safety) before destructive rewrite.
3. Use `git filter-repo` (preferred) or BFG:

- Install: `pip install git-filter-repo` (or refer to docs).
- Run: `git filter-repo --invert-paths --path .env --path .env.production --path .env.vercel` (repeat for any historically sensitive files) OR use `--replace-text replacement.txt` to rewrite specific keys.

4. Force push: `git push --force --tags origin main` (coordinate with team first).
5. Invalidate all previously exposed credentials (see rotation steps) regardless of purge.
6. Ask collaborators to re-clone (old clones retain secret history).
7. Enable repository secret scanning (GitHub Advanced Security if available) for umbrella protection.

## Allow-List Guidance

Some patterns (e.g., lock file integrity hashes, public URLs, example placeholders) are safe. To suppress noise:

1. Prefer not to globally ignore patterns—risk of masking real leaks.
2. Instead, add filename-based conditional inside `scan-secrets.cjs` (e.g., skip high-entropy for `package-lock.json`).
3. For legitimate test JWT tokens, prefix with `TEST_ONLY_` and optionally add a regex branch lowering severity.
4. Document any allow-list decisions here to maintain reviewer awareness.

## Future Enhancements (Suggested)

- Add patterns: Stripe (sk*live*), Slack (xoxb-), GitHub PAT (ghp\_), OpenAI (sk-), Cloudflare (CF_API_TOKEN).
- Add SARIF output for GitHub code scanning integration.
- Parallel file scanning (Node worker_threads) if repo grows large.
- Sampled periodic ledger hash verification integrated with secret scan job (defense-in-depth check).
