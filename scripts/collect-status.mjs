import { mkdir, writeFile } from 'node:fs/promises';

const sources = [
  ['stripe', 'https://status.stripe.com/api/v2/summary.json'],
  ['vercel', 'https://www.vercel-status.com/api/v2/summary.json'],
  ['github', 'https://www.githubstatus.com/api/v2/summary.json'],
  ['openai', 'https://status.openai.com/api/v2/summary.json'],
  ['sentry', 'https://status.sentry.io/api/v2/summary.json'],
  ['slack', 'https://slack-status.com/api/v2/summary.json'],
  ['cloudflare', 'https://www.cloudflarestatus.com/api/v2/summary.json']
];

const toStatus = (indicator) => {
  if (indicator === 'major' || indicator === 'critical') return 'degraded';
  if (indicator === 'minor') return 'degraded';
  return 'operational';
};

async function collect([service, url]) {
  const started = performance.now();
  try {
    const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'eagle-eye-status-collector/1.0' }, signal: AbortSignal.timeout(8000) });
    const latency = Math.round(performance.now() - started);
    if (!response.ok) return { service, status: 'monitoring', latency, source: 'official', evidenceUrl: url, error: `HTTP ${response.status}` };
    const body = await response.json();
    return { service, status: toStatus(body.status?.indicator), latency, source: 'official', evidenceUrl: url };
  } catch (error) {
    return { service, status: 'monitoring', latency: Math.round(performance.now() - started), source: 'official', evidenceUrl: url, error: error instanceof Error ? error.message : 'request failed' };
  }
}

const observations = await Promise.all(sources.map(collect));
const payload = { generatedAt: new Date().toISOString(), collector: 'github-actions', observations };
await mkdir('public', { recursive: true });
await writeFile('public/telemetry.json', `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload, null, 2));
