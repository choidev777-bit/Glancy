import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

for (const file of [
  'docs/evidence/README.md',
  'docs/evidence/skills-to-code-matrix.md',
  'docs/evidence/prompt-log.md',
  'docs/evidence/rebuild-from-skills.md',
  'docs/evidence/generated-artifacts.md',
  'docs/submission.md',
]) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
}

const index = read('docs/evidence/README.md');
assert.match(index, /Glancy Vibe Coding Evidence/);
assert.match(index, /Skills Runtime Demo/);
assert.match(index, /Evidence Index/);

const matrix = read('docs/evidence/skills-to-code-matrix.md');
for (const moduleName of ['main.md', 'data.md', 'indicators.md', 'insights.md', 'charts.md', 'layout.md', 'theme.md']) {
  assert.match(matrix, new RegExp(moduleName.replace('.', '\\.')));
}
assert.match(matrix, /src\/components\/skills/);

const promptLog = read('docs/evidence/prompt-log.md');
assert.match(promptLog, /Brainstorming/);
assert.match(promptLog, /Writing Plans/);
assert.match(promptLog, /Implementation/);
assert.match(promptLog, /Codex/);

const rebuild = read('docs/evidence/rebuild-from-skills.md');
assert.match(rebuild, /Recommended Prompt Order/);
assert.match(rebuild, /Success Criteria/);

const artifacts = read('docs/evidence/generated-artifacts.md');
assert.match(artifacts, /Backend/);
assert.match(artifacts, /Frontend/);
assert.match(artifacts, /Skills runtime/);

const submission = read('docs/submission.md');
assert.match(submission, /Vibe Coding Evidence/);
assert.match(submission, /docs\/evidence\/README.md/);
