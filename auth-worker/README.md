# Eagle Eye GitHub OAuth worker

This small Cloudflare Worker is the runtime authentication API for the static GitHub Pages UI. GitHub OAuth is free; the worker keeps the OAuth client secret and session signing key off the public site.

## Configure

Create a GitHub OAuth App with callback URL:

```text
https://eagle-eye-auth.<your-subdomain>.workers.dev/api/auth/github/callback
```

Set secrets:

```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put SESSION_SECRET
```

Edit `wrangler.toml` to add allowed GitHub logins. Deploy with:

```bash
npx wrangler deploy
```

Set the dashboard build variable to the worker URL:

```bash
$env:VITE_AUTH_BASE_URL = 'https://eagle-eye-auth.<your-subdomain>.workers.dev'
npm run build
```

The worker supports `/api/auth/github`, `/api/auth/github/callback`, `/api/auth/me`, and `/api/auth/logout`. It signs an HttpOnly session cookie and maps allowlisted GitHub users to `owner`, `operator`, or `viewer`.
