const baseUrl = process.env.WEEKLY_TEST_BASE_URL || 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dashboardResponse = await fetch(`${baseUrl}/api/dashboard`);
assert(dashboardResponse.ok, `dashboard API returned ${dashboardResponse.status}`);
const dashboard = await dashboardResponse.json();
const report = dashboard.weeklyReport;
assert(report, 'weekly report fallback is missing');
assert(Array.isArray(report.sections) && report.sections.length > 0, 'weekly report sections are missing');
assert(Array.isArray(report.watch_points) && report.watch_points.length >= 2, 'weekly watch points are missing');
assert(Array.isArray(report.source_ids), 'weekly source ids are missing');
assert(Array.isArray(report.evidence), 'weekly evidence is missing');

const evidenceIds = new Set(report.evidence.map((item) => item.id));
for (const section of report.sections) {
  assert(['platform_action', 'market_change', 'demand_theme', 'data_note'].includes(section.type), `invalid section type ${section.type}`);
  for (const id of section.evidenceIds || []) {
    assert(evidenceIds.has(id), `weekly section references missing evidence ${id}`);
  }
}
assert(report.evidence.every((item) => item.category !== 'version_maintenance'), 'maintenance update leaked into weekly evidence');

const pageResponse = await fetch(`${baseUrl}/reports?week=invalid-week`);
assert(pageResponse.ok, `weekly page returned ${pageResponse.status}`);
const html = await pageResponse.text();
for (const text of ['本周关键变化', '下周继续观察', '证据与来源', '历史周报']) {
  assert(html.includes(text), `weekly page is missing ${text}`);
}

console.log('Weekly report verification passed.');
