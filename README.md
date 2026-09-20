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
- Product/IP notices in `NOTICE.md`
- Competitive positioning and benchmark plan in `docs/COMPETITIVE_EDGE.md`

The current UI uses a deterministic local signal set so it runs safely as a static GitHub Pages site. This is intentional: browser-only apps cannot safely hold private API keys, and many vendor APIs do not allow cross-origin requests. The collector contract below is the extension point for a small server-side worker.

## The distinctive idea

Eagle Eye is built around **Signal Constellation**: an evidence-weighted dependency graph that fuses official status pages, direct probes, synthetic journeys, public corroboration, and application telemetry. It preserves uncertainty when a source is missing, then explains which product path is most likely affected and why. This is the public product description; detailed invention records, claims, diagrams, experiments, and filing strategy stay outside this public repository.

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

Useful collector targets include vendor status pages and APIs, HTTP/TCP/DNS probes, synthetic user journeys, GitHub webhooks, Sentry events, public DNS health checks, and public incident aggregators. Keep third-party requests behind the collector so the browser only receives normalized health facts.

## GitHub Pages

1. Push the repository to GitHub with the default branch named `main`.
2. In repository settings, open **Pages** and select **GitHub Actions** as the source.
3. Push a change. The included workflow installs dependencies, builds `dist`, and publishes the dashboard.

### Public dashboard

Eagle Eye is currently an open dashboard with no login gate. Anyone with the Pages URL can view the observability surface.

## Product boundary

This repository now includes a GitHub Actions collector that refreshes public vendor status APIs every 15 minutes and publishes the normalized result as `telemetry.json`. A production collector service is still needed for private APIs, rate limiting, retries, vendor-specific authentication, persistence, alert routing, and sub-minute checks. The UI is ready for that normalized API without exposing credentials in the browser.

## GitHub-native operations

- `push` to `main`: build and deploy the Pages artifact
- Every 15 minutes: collect public status signals, rebuild, and deploy
- `workflow_dispatch`: manually refresh signals and deploy
- No vendor secrets are required by the public collector; private integrations belong in GitHub Actions secrets or a protected worker

## No-cost and open-source policy

- Runtime code uses Vite, TypeScript, and Node.js standard-library APIs.
- No paid npm package, proprietary auth SDK, Cloudflare account, or trial-only service is required.
- GitHub Pages and GitHub Actions are used for the public dashboard and scheduled public checks.
- The optional `auth-server/` folder is retained as an open-source extension, but is not part of the public dashboard runtime.

## Product preview

![Eagle Eye command center](docs/eagle-eye-command-center.png)

The preview shows the service health table, live activity feed, focused dependency latency, and operational metrics in one scan-friendly control room.