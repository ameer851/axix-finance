# Project Memory

---

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

- Libraries researched on Context7: Supabase RLS best practices, Vercel rewrites/functions configuration (official docs referenced)
- Best practices discovered: Use JSON 404 for unmatched /api; avoid anon client writes against RLS-protected tables
- Implementation patterns used: POST /api/auth/create-profile using service role; prune extra api files on Vercel to limit functions
- Version-specific findings: Pending

## Conversation History

- Important decisions made: Consolidated to single Express function; removed deprecated auth helper endpoints; added create-profile route; tightened CORS
- Recurring questions or topics: Signup JSON parse errors; Vercel function limits; visitors feature removal
- Solutions that worked well: JSON 404 for /api; server-side profile creation
- Things to avoid or that didn't work: Client anon inserts into RLS tables

## Notes

- Latest changes: Client register now calls /api/auth/create-profile; added no-op /api/send-welcome-email endpoint; builds pass
- Next validation: Deploy with pruning on Vercel and verify signup end-to-end in production
- Deployment: Redeployed production with API root JSON fix to prevent HTML fallback; verified /api/health returns JSON; pending end-to-end signup smoke tests
