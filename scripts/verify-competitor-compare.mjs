const baseUrl = process.env.COMPARE_TEST_BASE_URL || 'http://localhost:3000';
const ids = ['hujiang', 'izaodao', 'koolearn-languages'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await fetch(`${baseUrl}/api/competitors/compare?ids=${ids.join(',')}`);
assert(response.ok, `compare API returned ${response.status}`);
const data = await response.json();
assert(data.competitors?.length === ids.length, 'compare API returned the wrong competitor count');
assert(data.competitors.every((item, index) => item.id === ids[index]), 'compare API did not preserve selection order');

for (const item of data.competitors) {
  for (const field of [
    'supported_languages', 'platforms', 'learning_modes', 'key_features',
    'products', 'product_types', 'update_categories',
  ]) {
    assert(Array.isArray(item[field]), `${item.id}.${field} must be an array`);
  }
  for (const field of [
    'product_count', 'meaningful_updates_30d', 'maintenance_updates_30d',
    'meaningful_updates_90d', 'snapshot_count', 'profile_completeness',
  ]) {
    assert(typeof item[field] === 'number', `${item.id}.${field} must be numeric`);
  }
  assert(item.profile_completeness >= 0 && item.profile_completeness <= 7, `${item.id} completeness is invalid`);
}

const invalidResponse = await fetch(`${baseUrl}/api/competitors/compare?ids=hujiang`);
assert(invalidResponse.status === 400, 'compare API must reject fewer than two competitors');

console.log('Competitor comparison verification passed.');
