# Eagle Eye Observability

Eagle Eye is a GitHub-friendly SaaS and web-services observability control room. It models service dependencies, combines multiple health signals, and makes the operational picture easy to scan.

## What is included

- Live dashboard polling with service health, latency, uptime, and incident signals
- Service filtering and focus details for connected dependencies
- Dependency graph view for tracing impact across your system
- Incident view with an evidence stack for official, synthetic, and community signals
- In-product collector and deployment documentation
- GitHub Pages deployment workflow in `.github/workflows/deploy.yml`
- Private access and RBAC deployment guidance in `ACCESS_CONTROL.md`
- Scheduled public status collection via `scripts/collect-status.mjs`

The current UI uses a deterministic local signal set so it runs safely as a static GitHub Pages site. This is intentional: browser-only apps cannot safely hold private API keys, and many vendor APIs do not allow cross-origin requests. The collector contract below is the extension point for a small server-side worker.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Connecting real services

Create a server-side collector for each vendor or internal system. Keep credentials in GitHub Actions secrets, a managed secret store, or your runtime environment. Normalize each observation before sending it to the dashboard API:

```ts
type Signal = {
	service: string
	status: 'up' | 'down' | 'degraded'
	latencyMs: number
	observedAt: string
	source: 'official' | 'api' | 'synthetic' | 'community'
	region?: string
	evidenceUrl?: string
}
```

Useful collector targets include vendor status pages and APIs, HTTP/TCP/DNS probes, synthetic user journeys, GitHub webhooks, Sentry events, Cloudflare health checks, AWS/GCP service health, and public incident aggregators. Keep third-party requests behind the collector so the browser only receives normalized health facts.

## GitHub Pages

1. Push the repository to GitHub with the default branch named `main`.
2. In repository settings, open **Pages** and select **GitHub Actions** as the source.
3. Push a change. The included workflow installs dependencies, builds `dist`, and publishes the dashboard.

### Private access and roles

Standard public GitHub Pages cannot enforce a private user allowlist. Do not add a fake client-side login. For a real restricted deployment, keep the repository private and put the Pages hostname behind Cloudflare Access (or use GitHub Enterprise Cloud Pages visibility where available). Configure GitHub organization membership as the identity allowlist, then map teams to `Owner`, `Operator`, and `Viewer` policies. See [ACCESS_CONTROL.md](ACCESS_CONTROL.md) for the exact model and collector authorization boundary.

## Product boundary

This repository now includes a GitHub Actions collector that refreshes public vendor status APIs every 15 minutes and publishes the normalized result as `telemetry.json`. A production collector service is still needed for private APIs, rate limiting, retries, vendor-specific authentication, persistence, alert routing, and sub-minute checks. The UI is ready for that normalized API without exposing credentials in the browser.

## GitHub-native operations

- `push` to `main`: build and deploy the Pages artifact
- Every 15 minutes: collect public status signals, rebuild, and deploy
- `workflow_dispatch`: manually refresh signals and deploy
- No vendor secrets are required by the public collector; private integrations belong in GitHub Actions secrets or a protected worker

## SaaS login contract

The app includes a production-shaped login screen. It sends credentials to `POST /api/auth/login` and only marks the browser session active after the server returns success. GitHub Pages does not provide that API, so a real SaaS deployment must attach an API service at that route or configure a reverse proxy.

Expected request:

```json
{ "username": "you@company.com", "password": "..." }
```

Expected success response: `200` with a secure, `HttpOnly`, `SameSite=Lax` session cookie. Expected failure response: `401`. Hash passwords with Argon2id or bcrypt, rate-limit login attempts, require MFA for operators, and enforce RBAC on every API request. Never store passwords or long-lived tokens in the browser.

For an all-GitHub stack, host the static UI on Pages, run the auth/collector API as a container on a GitHub-connected platform, and store configuration in GitHub Actions environments and secrets. Public Pages alone cannot provide username/password authentication.