# Project Memory

## applyTo: '\*\*'

## User Memory

## User Preferences

- Programming languages: TypeScript, JavaScript
- Code style preferences: Concise, robust error handling, avoid placeholders
- Development environment: VS Code on Windows, PowerShell shell
- Communication style: Short, direct, and actionable

## Project Context

- Current project type: Full-stack web app (client + API)
- Tech stack: Vite client, Express API (single serverless function), Supabase backend, Vercel hosting
- Architecture patterns: Consolidated serverless function for all /api routes, SPA client, service-role backed admin routes
- Key requirements: Stable signup, eliminate invalid JSON responses, stay under Vercel Hobby function limits, strict CORS allowlist

## Coding Patterns

- Preferred patterns and practices: Centralized fetch wrapper with safe JSON parsing; service-role operations on server only
- Code organization preferences: Single /api/server.ts route aggregator, client services in client/src/services
- Testing approaches: Build locally, smoke test API endpoints (/api/health, /api/ping), then end-to-end signup
- Documentation style: Brief checklists and summaries in repo docs (FIXES_APPLIED.md, FINAL_FIXES_SUMMARY.md)

## Context7 Research History

- Libraries researched: Vercel rewrites and serverless function routing; Supabase admin client usage server-side
- Best practices discovered: Use JSON 404 for unmatched /api; avoid anon client writes against RLS-protected tables; prefer same-origin /api to bypass preview auth pages
- Implementation patterns used: POST /api/auth/create-profile using service role; prune extra api files on Vercel to limit functions
- Version-specific findings: Vercel v2 project config uses rewrites to route /api and /api/(.\*) to a single function entry
- Sources: [Vercel rewrites](https://vercel.com/docs/projects/project-configuration#rewrites), [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions), [Supabase initializing](https://supabase.com/docs/reference/javascript/initializing)

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
