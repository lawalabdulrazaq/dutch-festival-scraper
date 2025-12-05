import 'dotenv/config';
import { getScrapers } from '../src/scrapers';
import { logger } from '../src/utils/logger';

async function runSingle(name: string) {
  const scrapers = getScrapers();
  const scraper = scrapers.find(s => s['config'].name.toLowerCase() === name.toLowerCase());
  if (!scraper) {
    logger.error(`Scraper not found or not enabled: ${name}`);
    process.exit(1);
  }

  logger.info(`Running scraper: ${scraper['config'].name}`);
  const result = await scraper.execute();

  if (!result.success) {
    logger.error(`Scraper failed: ${result.error}`);
    process.exit(1);
  }

  logger.info(`Extracted ${result.events.length} events`);
  if (result.events.length > 0) {
    console.log(JSON.stringify(result.events.slice(0, 10), null, 2));
  }

  process.exit(0);
}

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: ts-node scripts/test-scraper.ts <ScraperName>');
  process.exit(1);
}

runSingle(args[0]).catch(err => {
  logger.error('Test scraper failed', err);
  process.exit(1);
});
