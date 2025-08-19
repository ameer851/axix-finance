# Deploying Axix Finance to Fly.io

This app runs a single Node process serving both API under /api and the built Vite client as static files.

## Prereqs

- Install Fly CLI: <https://fly.io/docs/hands-on/install-flyctl/>
- Sign in: `fly auth login`

## First-time setup

- Update `fly.toml` app name if you want a different slug.
- Set secrets (examples):
  - `fly secrets set SUPABASE_URL=...`
  - `fly secrets set SUPABASE_SERVICE_ROLE_KEY=...`
  - `fly secrets set SESSION_SECRET=...`
  - `fly secrets set RESEND_API_KEY=...`

## Deploy

- `fly launch --no-deploy` (optional, if you want to tweak regions)
- `fly deploy`

The app listens on PORT=8080 and exposes /health for health checks.

## Notes

- CORS allows `*.fly.dev` and your custom domains. Set `CORS_ORIGIN`/`FRONTEND_URL` in Fly secrets if needed.
- Build artifacts are copied to `dist/server/public`; server entry is `dist/server/index.js`.

## Custom Domains and TLS

You can serve the app on your own domain in addition to `<app>.fly.dev`.

1. Add DNS records (pick ONE setup per hostname):

- A/AAAA (recommended at apex):
  - A → 66.241.125.177
  - AAAA → 2a09:8280:1::91:23cd:0

- CNAME (good for subdomains like `www`):
  - CNAME `www` → axix-finance.fly.dev (or the current `<app>.fly.dev`)
  - Note: For apex/root, only use CNAME if your DNS supports CNAME flattening/ALIAS/ANAME.

- Behind a proxy/CDN (Cloudflare orange-cloud, etc.):
  - Create only an AAAA record to the IPv6 address above.
  - Set SSL mode to Full/Full (Strict). Avoid Flexible.

1. Add certificates on Fly (one per hostname):

Run:

```bash
fly certs add example.com
fly certs add www.example.com
```

1. (Optional) Pre-issue or when proxying: add ACME DNS-01 CNAME

Create a CNAME: `_acme-challenge.<host>` → `<host>.<token>.flydns.net` as shown by `fly certs show \<host\>`.

1. Check status until Ready:

Run:

```bash
fly certs check <host>
fly certs list
```

Docs: <https://fly.io/docs/networking/custom-domain/>
