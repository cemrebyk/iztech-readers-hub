// scripts/enrich.ts
import { bulkEnrichBooks } from '../lib/actions/enrich-tags';

async function run() {
    console.log("🛠️  Iztech Reader's Hub - Veri Normalizasyon Aracı");
    const result = await bulkEnrichBooks();
    process.exit(0);
}

run();