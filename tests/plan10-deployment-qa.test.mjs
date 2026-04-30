import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);

for (const file of [
  '.env.local.example',
  'vercel.json',
  'backend/railway.json',
  'docs/deployment/env-vars.md',
  'docs/deployment/judge-demo-script.md',
  'docs/deployment/qa-checklist.md',
  'docs/deployment/incident-playbook.md',
]) {
  assert.ok(exists(file), `${file} should exist`);
}

const frontendEnv = read('.env.local.example');
assert.match(frontendEnv, /VITE_API_BASE_URL=/);
assert.match(frontendEnv, /VITE_ENABLE_SAMPLE_FALLBACK=true/);
assert.match(frontendEnv, /VITE_ENABLE_SKILLS_RUNTIME_DEMO=true/);

const backendEnv = read('backend/.env.example');
assert.match(backendEnv, /ALLOWED_ORIGINS=.*localhost:5173/);
assert.match(backendEnv, /ENABLE_SAMPLE_FALLBACK=true/);
assert.match(backendEnv, /CACHE_TTL_SECONDS=300/);

const envDocs = read('docs/deployment/env-vars.md');
assert.match(envDocs, /Vercel/);
assert.match(envDocs, /Railway/);
assert.match(envDocs, /VITE_API_BASE_URL/);
assert.match(envDocs, /ALLOWED_ORIGINS/);

const demoScript = read('docs/deployment/judge-demo-script.md');
assert.match(demoScript, /0:00-0:30/);
assert.match(demoScript, /Skills Runtime Demo/);
assert.match(demoScript, /CSV Upload/);

const qa = read('docs/deployment/qa-checklist.md');
assert.match(qa, /Production URL/);
assert.match(qa, /npm run build/);
assert.match(qa, /Railway.*\/health/);

const playbook = read('docs/deployment/incident-playbook.md');
assert.match(playbook, /External API Down/);
assert.match(playbook, /CORS Error/);
assert.match(playbook, /Vercel Build Failure/);

const railway = JSON.parse(read('backend/railway.json'));
assert.equal(railway.deploy.healthcheckPath, '/health');
assert.match(railway.deploy.startCommand, /uvicorn/);

const vercel = JSON.parse(read('vercel.json'));
assert.equal(vercel.framework, 'vite');
