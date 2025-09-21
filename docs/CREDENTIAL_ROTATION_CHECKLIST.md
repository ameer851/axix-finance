# Credential Rotation Checklist

Use this runbook immediately after detecting a secret exposure or on scheduled quarterly rotations.

## 0. Preconditions

- [ ] Latest `main` pulled locally
- [ ] Working tree clean (no uncommitted secret removals pending)
- [ ] All secret values stored temporarily in a secure vault (not in shell history)

## 1. Identify & Classify

- [ ] Enumerate leaked identifiers (scan output, commit diff)
- [ ] Map each to issuing system (Supabase, Resend, DB, JWT, Session, Other)
- [ ] Determine blast radius (read/write scope, prod vs staging)

## 2. Freeze Risky Automation (If Needed)

- [ ] Pause scheduled job/machine invoking affected keys (Fly: `fly machine stop <id>` or remove schedule)
- [ ] Disable any CI/CD that might redeploy with stale keys

## 3. Generate Replacements

For each credential:

- Supabase Service Role / Anon: Regenerate via Supabase dashboard → Project Settings → API
- JWT Secret: 32+ random chars: `openssl rand -base64 48 | tr -d '\n'`
- Session Secret: Same generation method (distinct value)
- Resend API Key: Create new key in dashboard → delete old
- Database Password: Rotate role password in Postgres (or create new role, migrate grants)

## 4. Update Secret Stores

Preferred: never place secrets in repo files.

- Fly: `fly secrets set KEY=VALUE ...`
- Local Dev: `.env.local` (ignored) or OS-level secret store
- CI: GitHub Repo Settings → Actions Secrets → update entries

## 5. Deploy / Restart

- [ ] Trigger deployment after all values updated
- [ ] Confirm environment variables visible to runtime (log one-way hash length only)

## 6. Invalidate Old Credentials

- [ ] Delete previous Supabase keys
- [ ] Remove old Resend key
- [ ] Revoke DB password / drop old role (if replaced)
- [ ] Confirm old JWT no longer validates (expected auth failures)

## 7. Verify Application Health

- [ ] /api/health returns ok
- [ ] Auth login / protected endpoints succeed with newly issued tokens
- [ ] Daily job manual trigger works (no secret-related exceptions)
- [ ] Email send test passes

## 8. Git History Sanitation (If Needed)

(See `SECRET_HYGIENE.md` section) then force push & notify team to re-clone.

## 9. Documentation & Audit Trail

- [ ] Update `SECRET_HYGIENE.md` rotation date
- [ ] Record ticket / incident ID
- [ ] Add summary to `memory.instruction.md` Notes section

## 10. Post-Rotation Monitoring (24h)

- [ ] Scan logs for auth/database errors
- [ ] Re-run secret scanner: `npm run secret:scan`
- [ ] Schedule next rotation reminder

---

### Quick Command Snippets (Optional)

```
# Generate strong secret
openssl rand -hex 48

# Rotate Fly secrets (example)
fly secrets set JWT_SECRET=$(openssl rand -hex 48) SESSION_SECRET=$(openssl rand -hex 48)

# Validate env inside running machine (debug; remove after use)
fly ssh console -C "printenv | grep -E 'JWT_SECRET|SESSION_SECRET' | sed 's/=.*/=<redacted>/g'"
```

### Notes

- Avoid reusing any value across JWT, session, or encryption keys.
- Always rotate service role key if ever exposed; anon key rotation optional (public, but rotate if doubt).
