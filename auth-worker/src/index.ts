interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  APP_ORIGIN: string;
  ALLOWED_GITHUB_USERS: string;
  OWNER_GITHUB_USERS?: string;
  OPERATOR_GITHUB_USERS?: string;
}

const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-credentials': 'true' };
const encoder = new TextEncoder();

function json(data: unknown, status = 200, extra: HeadersInit = {}) { return new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } }); }
function users(value = '') { return new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)); }
function base64(value: ArrayBuffer | string) { const bytes = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value); let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
function unbase64(value: string) { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)), (character) => character.charCodeAt(0)); }
async function signature(value: string, secret: string) { const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); return base64(await crypto.subtle.sign('HMAC', key, encoder.encode(value))); }
async function signed(value: string, secret: string) { return `${base64(value)}.${await signature(value, secret)}`; }
async function verified(token: string, secret: string) { const [encoded, provided] = token.split('.'); if (!encoded || !provided) return null; const value = new TextDecoder().decode(unbase64(encoded)); const expected = await signature(value, secret); return expected === provided ? value : null; }
function cookie(request: Request, name: string) { return request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1); }
function redirect(url: string, cookieHeader?: string) { return new Response(null, { status: 302, headers: { location: url, ...(cookieHeader ? { 'set-cookie': cookieHeader } : {}) } }); }

export default { async fetch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { headers: { ...headers, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' } });
  if (url.pathname === '/api/auth/github') {
    const state = await signed(crypto.randomUUID(), env.SESSION_SECRET);
    const callback = `${url.origin}/api/auth/github/callback`;
    const location = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(env.GITHUB_CLIENT_ID)}&redirect_uri=${encodeURIComponent(callback)}&scope=read:user%20user:email&state=${encodeURIComponent(state)}`;
    return redirect(location, `eagle_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  }
  if (url.pathname === '/api/auth/github/callback') {
    const state = await verified(url.searchParams.get('state') ?? '', env.SESSION_SECRET);
    if (!state || state !== (await verified(cookie(request, 'eagle_oauth_state') ?? '', env.SESSION_SECRET))) return json({ error: 'Invalid OAuth state' }, 400);
    const code = url.searchParams.get('code');
    if (!code) return json({ error: 'Missing OAuth code' }, 400);
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }) });
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return json({ error: 'GitHub OAuth exchange failed' }, 502);
    const profileResponse = await fetch('https://api.github.com/user', { headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token.access_token}`, 'user-agent': 'eagle-eye-auth' } });
    const profile = await profileResponse.json() as { login?: string; id?: number; name?: string };
    const login = profile.login?.toLowerCase() ?? '';
    if (!users(env.ALLOWED_GITHUB_USERS).has(login)) return json({ error: 'Your GitHub account is not allowed in this workspace.' }, 403);
    const role = users(env.OWNER_GITHUB_USERS).has(login) ? 'owner' : users(env.OPERATOR_GITHUB_USERS).has(login) ? 'operator' : 'viewer';
    const session = await signed(JSON.stringify({ login, id: profile.id, name: profile.name, role, exp: Date.now() + 8 * 60 * 60 * 1000 }), env.SESSION_SECRET);
    return redirect(env.APP_ORIGIN, `eagle_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800; ${cookie(request, 'eagle_oauth_state') ? 'eagle_oauth_state=; Max-Age=0; Path=/;' : ''}`);
  }
  if (url.pathname === '/api/auth/me') {
    const raw = await verified(cookie(request, 'eagle_session') ?? '', env.SESSION_SECRET);
    if (!raw) return json({ authenticated: false }, 401);
    const session = JSON.parse(raw) as { exp: number };
    if (session.exp < Date.now()) return json({ authenticated: false }, 401);
    return json({ authenticated: true, ...session });
  }
  if (url.pathname === '/api/auth/logout') return redirect(env.APP_ORIGIN, 'eagle_session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');
  return json({ service: 'eagle-eye-auth', status: 'ok' });
} };
