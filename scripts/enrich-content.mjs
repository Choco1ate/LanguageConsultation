const args = new Set(process.argv.slice(2));
const limitArg = [...args].find((arg) => arg.startsWith('--limit='));
const limit = Number(limitArg?.split('=')[1] || 30);
const backfill = args.has('--backfill');
const baseUrl = process.env.CONTENT_JOB_BASE_URL || 'http://localhost:3000';
const secret = process.env.CRON_SECRET;

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is required for content enrichment.');
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/cron/enrich-content`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(secret ? { authorization: `Bearer ${secret}` } : {}),
  },
  body: JSON.stringify({ limit, backfill }),
});

const result = await response.json();
if (!response.ok) {
  console.error(result);
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
