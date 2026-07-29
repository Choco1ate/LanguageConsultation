import { initDb } from '../src/lib/db';

console.log('Initializing database...');
initDb();
console.log('Database initialized successfully at data/app.db');
console.log('Tables created: competitors, competitor_products, product_media, competitor_updates, articles');
process.exit(0);
