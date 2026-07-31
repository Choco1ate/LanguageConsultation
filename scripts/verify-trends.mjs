const baseUrl = process.env.TREND_TEST_BASE_URL || 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const range of ['7d', '30d']) {
  const response = await fetch(`${baseUrl}/api/insights?range=${range}&language=all`);
  assert(response.ok, `${range} insights API returned ${response.status}`);
  const data = await response.json();
  assert(data.period?.range === range, `${range} period is missing`);
  assert(data.period.current?.start && data.period.previous?.start, `${range} comparison periods are incomplete`);
  assert(Array.isArray(data.findings), `${range} findings must be an array`);
  assert(Array.isArray(data.evidence), `${range} evidence must be an array`);
  assert(data.signals?.platforms && data.signals?.categories, `${range} signals are incomplete`);
  assert(typeof data.coverage?.successRate === 'number', `${range} coverage is incomplete`);
  const evidenceIds = new Set(data.evidence.map((item) => item.id));
  for (const finding of data.findings) {
    for (const id of finding.evidenceIds || []) {
      assert(evidenceIds.has(id), `${range} finding ${finding.id} references missing evidence ${id}`);
    }
  }
}

const invalidLanguageResponse = await fetch(`${baseUrl}/api/insights?range=7d&language=chinese`);
assert(invalidLanguageResponse.ok, 'invalid language fallback failed');
const invalidLanguageData = await invalidLanguageResponse.json();
assert(invalidLanguageData.languageHeat?.every((item) => item.key !== 'chinese'), 'Chinese content leaked into insights');

console.log('Trend API verification passed.');
