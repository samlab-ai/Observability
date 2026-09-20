import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 8787);
const appOrigin = process.env.APP_ORIGIN ?? 'http://localhost:5173';
const appOriginUrl = new URL(appOrigin);
const appOriginHost = appOriginUrl.origin;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;

if (!githubClientId || !githubClientSecret || !sessionSecret) {
  console.error('Missing GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, or SESSION_SECRET.');
  process.exit(1);
}

const cookieValue = (request, name) => request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
const encode = (value) => Buffer.from(value).toString('base64url');
const sign = (value) => `${encode(value)}.${createHmac('sha256', sessionSecret).update(value).digest('base64url')}`;
const readSigned = (token) => {
  if (!token) return null;
  const [encoded, provided] = token.split('.');
  if (!encoded || !provided) return null;
  const value = Buffer.from(encoded, 'base64url').toString();
  const expected = createHmac('sha256', sessionSecret).update(value).digest('base64url');
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  return value;
};
const send = (response, status, body, extra = {}) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': appOriginHost, 'access-control-allow-credentials': 'true', ...extra }); response.end(JSON.stringify(body)); };
const redirect = (response, location, cookie) => { response.writeHead(302, { location, ...(cookie ? { 'set-cookie': cookie } : {}) }); response.end(); };
const jsonBody = async (request) => { let body = ''; for await (const chunk of request) body += chunk; return body ? JSON.parse(body) : {}; };

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'access-control-allow-origin': appOriginHost, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }); response.end(); return; }
  if (url.pathname === '/api/auth/github') {
    const state = sign(`${randomBytes(24).toString('hex')}.${Date.now()}`);
    const callback = `${url.origin}/api/auth/github/callback`;
    const githubUrl = new URL('https://github.com/login/oauth/authorize');
    githubUrl.searchParams.set('client_id', githubClientId); githubUrl.searchParams.set('redirect_uri', callback); githubUrl.searchParams.set('scope', 'read:user user:email'); githubUrl.searchParams.set('state', state);
    redirect(response, githubUrl, `eagle_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`); return;
  }
  if (url.pathname === '/api/auth/github/callback') {
    const state = readSigned(cookieValue(request, 'eagle_oauth_state'));
    const returnedState = readSigned(url.searchParams.get('state'));
    if (!state || !returnedState || state !== returnedState) { send(response, 400, { error: 'Invalid OAuth state' }); return; }
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: githubClientId, client_secret: githubClientSecret, code: url.searchParams.get('code') }) });
    const token = await tokenResponse.json();
    if (!token.access_token) { send(response, 502, { error: 'GitHub OAuth exchange failed' }); return; }
    const profileResponse = await fetch('https://api.github.com/user', { headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token.access_token}`, 'user-agent': 'eagle-eye-auth' } });
    const profile = await profileResponse.json();
    const session = sign(JSON.stringify({ login: profile.login, id: profile.id, name: profile.name, exp: Date.now() + 8 * 60 * 60 * 1000 }));
    redirect(response, appOrigin, `eagle_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800; eagle_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`); return;
  }
  if (url.pathname === '/api/auth/me') {
    const raw = readSigned(cookieValue(request, 'eagle_session'));
    if (!raw) { send(response, 401, { authenticated: false }); return; }
    const session = JSON.parse(raw);
    if (session.exp < Date.now()) { send(response, 401, { authenticated: false }); return; }
    send(response, 200, { authenticated: true, ...session }); return;
  }
  if (url.pathname === '/api/auth/logout') { redirect(response, appOrigin, 'eagle_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'); return; }
  if (url.pathname === '/health') { send(response, 200, { service: 'eagle-eye-auth', status: 'ok' }); return; }
  send(response, 404, { error: 'Not found' });
});

server.listen(port, () => console.log(`Eagle Eye auth server listening on http://localhost:${port}`));
