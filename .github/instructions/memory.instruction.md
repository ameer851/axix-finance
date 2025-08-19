---
applyTo: "**"
---

# User Memory

## User Preferences

- Programming languages: TypeScript, JavaScript
- Code style preferences: Concise, robust error handling, avoid placeholders
- Development environment: VS Code on Windows, PowerShell shell
- Communication style: Short, direct, and actionable

## Project Context

- Current project type: Full-stack web app (client + API)
- Tech stack: Vite client, Express API, Supabase backend; migrated from Vercel to Fly.io (Dockerized)
- Architecture patterns: Consolidated serverless function for all /api routes, SPA client, service-role backed admin routes
- Key requirements: Stable signup, eliminate invalid JSON responses, stay under Vercel Hobby function limits, strict CORS allowlist

## Coding Patterns

- Preferred patterns and practices: Centralized fetch wrapper with safe JSON parsing; service-role operations on server only
- Code organization preferences: Single /api/server.ts route aggregator, client services in client/src/services
- Testing approaches: Build locally, smoke test API endpoints (/api/health, /api/ping), then end-to-end signup
- Documentation style: Brief checklists and summaries in repo docs (FIXES_APPLIED.md, FINAL_FIXES_SUMMARY.md)

## Context7 Research History

- Libraries researched: Vercel rewrites and serverless function routing; Supabase admin client usage server-side; Fly.io Dockerfile and fly.toml best practices; Fly.io custom domains and certificates
- Best practices discovered: Use JSON 404 for unmatched /api; avoid anon client writes against RLS-protected tables; prefer same-origin /api to bypass preview auth pages; for custom domains prefer A/AAAA on apex and CNAME on subdomains; ensure IPv6 present or use DNS-01 ACME CNAME; Cloudflare proxy requires AAAA-only + Full SSL
- Implementation patterns used: POST /api/auth/create-profile using service role; prune extra api files on Vercel to limit functions
- Version-specific findings: Vercel v2 project config uses rewrites to route /api and /api/(.\*) to a single function entry
- Sources: [Vercel rewrites](https://vercel.com/docs/projects/project-configuration#rewrites), [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions), [Supabase initializing](https://supabase.com/docs/reference/javascript/initializing), [Fly deploy with Dockerfile](https://fly.io/docs/languages-and-frameworks/dockerfile/), [Fly Node.js deep dive](https://fly.io/docs/deep-dive/nodejs/), [Fly custom domains](https://fly.io/docs/networking/custom-domain/)

## Conversation History

- Important decisions made: Consolidated to single Express function; removed deprecated auth helper endpoints; added create-profile route; tightened CORS
- Recurring questions or topics: Signup JSON parse errors; Vercel function limits; visitors feature removal
- Solutions that worked well: JSON 404 for /api; server-side profile creation; exact /api rewrite
- Things to avoid or that didn't work: Client anon inserts into RLS tables; hard-coding cross-origin API base to preview domain

## Notes

- Latest changes (2025-08-18):
  - Fixed package.json JSON parse error by closing root brace
  - Switched client default API base to same-origin '/api' to avoid HTML responses from preview domains
  - Local build passed; pushed to main for Vercel auto-deploy
- Next validation: After deploy, verify GET /api/ping and /api/health return JSON; run signup to confirm no Invalid JSON errors

- Root cause and mitigations (2025-08-18, later):
  - Root cause: Environment variable VITE_API_URL in production contained pasted CLI commands (semicolons, spaces, '%20'), producing requests like '/vercel%20env%20rm.../api/ping' which returned 308/HTML and broke JSON parsing
  - Mitigation: Implemented defensive sanitizer in client/src/config.ts (resolveApiUrl) to reject VITE_API_URL values with whitespace, semicolons, or encoded spaces and fall back to '/api'
  - Refactor: Replaced direct uses of import.meta.env.VITE_API_URL across client (lib/api.ts, services/api.ts, services/emailService.ts, services/authService.ts) to route via sanitized config.apiUrl
  - Validation: Local production build passed; all references now use config.apiUrl; this prevents malformed paths even if Vercel env var remains incorrect
  - Operational follow-up: Optionally correct or remove VITE_API_URL in Vercel to a clean origin or leave unset to prefer same-origin '/api'

- Migration to Fly.io (2025-08-18):
  - Added Dockerfile (multi-stage) to build server and client; copied client build to dist/server/public; runtime CMD runs dist/server/index.js on PORT 8080
  - Added fly.toml with internal_port 8080, HTTP health check at /health, and concurrency limits
  - Updated server to bind 0.0.0.0 when FLY_APP_NAME is present and default to PORT 8080 in production; broadened CORS to allow \*.fly.dev
  - Updated api/server.ts CORS allow \*.fly.dev and PORT default 8080 for dev path
  - Hardened .dockerignore for smaller images; added docs/DEPLOY_TO_FLY.md
  - Next steps: Set Fly secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET, RESEND_API_KEY, FRONTEND_URL/SITE_URL), run `fly launch --no-deploy` then `fly deploy`

- Fly deployment fixes and outcome (2025-08-18, later):
  - Server bundling: switched esbuild output to CommonJS (format=cjs, out-extension .cjs) to avoid dynamic require issues with CJS deps (jsonwebtoken/safe-buffer)
  - Removed dotenv from server bundle and marked as external; rely on Fly secrets/env
  - Dev-only Vite: ensured Vite and @vitejs/plugin-react are dynamically imported only in development and marked external in server build
  - Vite path safety: replaced import.meta.url top-level in server/vite.ts with a baseDir that works in CJS/ESM
  - Health check: made /health fast and non-blocking; moved DB/email initialization async after listen; extended Fly http/tcp check grace periods
  - Binding: always bind to 0.0.0.0 in production
  - Docker: updated CMD to run dist/server/index.cjs
  - Deploy status: fly deploy succeeded; app reachable at <https://axix-finance.fly.dev/> and /health returns `{"status":"ok"}`

- Custom domains status (2025-08-19):
  - App IPs: A 66.241.125.177, AAAA 2a09:8280:1::91:23cd:0
  - Created certs for www.axixfinance.com and axixfinance.com; both pending due to DNS mismatch at current provider (`vercel-dns`/`afeeshost`)
  - Required DNS:
    - Apex: A @ → 66.241.125.177; AAAA @ → 2a09:8280:1::91:23cd:0 (or ALIAS/ANAME/CNAME flattening to axix-finance.fly.dev)
    - WWW: CNAME www → gk51k1w.axix-finance.fly.dev (or A/AAAA as above)
  - Optional ACME: `_acme-challenge.\<host\>` CNAME to `\<host\>.gk51k1w.flydns.net` for pre-issuance
  - Next: Update DNS, wait to propagate, then `fly certs check <host>` until Status=Ready
