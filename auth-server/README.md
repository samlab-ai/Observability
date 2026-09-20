# Open-source GitHub login server

This auth server uses only Node.js built-ins and GitHub OAuth. It has no paid SDK, subscription, trial, or vendor runtime requirement. It is the secure backend companion to the GitHub Pages UI.

## Run

Create a GitHub OAuth App and set its callback URL to:

```text
http://localhost:8787/api/auth/github/callback
```

In PowerShell:

```powershell
$env:GITHUB_CLIENT_ID = 'your-oauth-client-id'
$env:GITHUB_CLIENT_SECRET = 'your-oauth-client-secret'
$env:SESSION_SECRET = 'generate-a-long-random-secret'
$env:APP_ORIGIN = 'http://localhost:5173'
$env:VITE_AUTH_BASE_URL = 'http://localhost:8787'
npm.cmd run auth
```

The server exposes `/api/auth/github`, `/api/auth/github/callback`, `/api/auth/me`, `/api/auth/logout`, and `/health`. It creates signed, HttpOnly, Secure cookies and does not store GitHub passwords or tokens.

For a public deployment, run this server on infrastructure you control. GitHub Pages is free and open for the static UI, but it cannot run a secure OAuth callback server. No hosting provider can be promised permanently free; self-hosting on a machine you already own is the only way to guarantee zero hosting cost.
