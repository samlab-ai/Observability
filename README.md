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

This repository is the dashboard and deployment shell. A production collector service still needs rate limiting, retries, vendor-specific authentication, persistence, alert routing, and a scheduled execution environment. The UI is ready for that normalized API without exposing credentials in the browser.