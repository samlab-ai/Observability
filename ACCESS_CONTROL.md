# Access control and RBAC

## Current access mode

Eagle Eye is currently public and has no login gate. Anyone with the GitHub Pages URL can view the dashboard. This is intentional for the free public demo.

## Important boundary

A public GitHub Pages site cannot run a secure OAuth callback. A browser-only gate is not security because the built files are still publicly downloadable.

Eagle Eye therefore uses this no-cost, open-source deployment model:

```text
GitHub Actions -> GitHub Pages (UI)
                         |
                         +-- self-hosted auth-server (GitHub OAuth)
```

## Recommended setup

1. Deploy the site with `.github/workflows/deploy.yml`.
2. Run `auth-server/` on a machine you control with HTTPS.
3. Create a GitHub OAuth App whose callback is `https://YOUR-AUTH-HOST/api/auth/github/callback`.
4. Set `VITE_AUTH_BASE_URL` to the auth server URL when building Pages.
5. Any GitHub account that completes OAuth can access the dashboard.
6. GitHub handles account security and optional MFA; the server stores no GitHub password.

## API and collector authorization

The static dashboard must never contain vendor tokens. Run collectors and any future API behind a server-side service. Enforce the same role claims there:

- `Owner`: manage monitors, collectors, users, and routing rules.
- `Operator`: acknowledge incidents, edit monitors, and view evidence.
- `Viewer`: read-only access.

Validate the identity token server-side on every request. Do not trust a role stored in `localStorage`, query parameters, or client-rendered HTML.

## Cost boundary

The repository contains no required paid service, trial dependency, or proprietary runtime. A machine, VPS, or hosted runtime may have its own cost; self-hosting the small Node server is the only way to guarantee zero hosting cost.
