import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = process.cwd();
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const db = new Database(join(projectRoot, 'data', 'app.db'));
const products = db.prepare(`
  SELECT id, competitor_id, name, official_url
  FROM competitor_products
  WHERE status = 'active'
  ORDER BY competitor_id, sort_order
`).all();
const upsertMedia = db.prepare(`
  INSERT INTO product_media (
    id, product_id, media_type, local_path, original_url, source_url,
    alt_text, sort_order, captured_at
  ) VALUES (?, ?, 'screenshot', ?, NULL, ?, ?, 1, CURRENT_TIMESTAMP)
  ON CONFLICT(product_id, media_type, sort_order) DO UPDATE SET
    local_path = excluded.local_path,
    source_url = excluded.source_url,
    alt_text = excluded.alt_text,
    captured_at = CURRENT_TIMESTAMP
`);

const capturedByUrl = new Map();
let captured = 0;
let failed = 0;

for (const product of products) {
  if (!product.official_url) continue;
  let publicPath = capturedByUrl.get(product.official_url);
  if (!publicPath) {
    const digest = createHash('sha1').update(product.official_url).digest('hex').slice(0, 10);
    publicPath = `/product-media/${product.competitor_id}/${digest}.png`;
    const outputPath = join(projectRoot, 'public', publicPath);
    mkdirSync(dirname(outputPath), { recursive: true });
    try {
      execFileSync(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--ignore-certificate-errors',
        '--window-size=1200,800',
        '--virtual-time-budget=5000',
        `--screenshot=${outputPath}`,
        product.official_url,
      ], { stdio: 'ignore', timeout: 25_000 });
      capturedByUrl.set(product.official_url, publicPath);
      captured++;
    } catch {
      failed++;
      continue;
    }
  }
  upsertMedia.run(
    `${product.id}-official-page`,
    product.id,
    publicPath,
    product.official_url,
    `${product.name}官方产品页截图`
  );
}

console.log(`Captured ${captured} official pages; ${failed} pages failed.`);
