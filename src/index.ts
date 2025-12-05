import { validateConfig, config } from './config/config';
import { getScrapers } from './scrapers';
import { supabaseService } from './services/supabase.service';
import { httpService } from './services/http.service';
import { FestivalEvent } from './types/event.types';
import { removeDuplicates } from './utils/string.utils';
import { logger } from './utils/logger';

/**
 * Main scraper execution
 */
async function runScraper(): Promise<void> {
  logger.info('🚀 Starting Dutch Festival Scraper...');
  
  // Validate configuration
  if (!validateConfig()) {
    process.exit(1);
  }

  try {
    // Load processed events from database
    logger.info('📦 Loading processed events from database...');
    const processedKeys = await supabaseService.getProcessedEvents();
    logger.info(`Found ${processedKeys.size} already processed events`);

    // Get all enabled scrapers
    let scrapers = getScrapers();

    // Support running a single scraper for fast testing via env var `SCRAPE_ONLY`
    const scrapeOnly = process.env.SCRAPE_ONLY?.trim();
    if (scrapeOnly) {
      const wanted = scrapeOnly.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      scrapers = scrapers.filter(s => wanted.includes((s as any).config.name.toLowerCase()));
      logger.info(`🧪 SCRAPE_ONLY active, running ${scrapers.length} scraper(s): ${wanted.join(', ')}`);
    } else {
      logger.info(`🕷️  Running ${scrapers.length} scrapers...`);
    }

    // Run all scrapers in parallel
    const results = await Promise.all(
      scrapers.map(scraper => scraper.execute())
    );

    // Collect all events
    let allEvents: FestivalEvent[] = [];
    results.forEach(result => {
      if (result.success) {
        allEvents = allEvents.concat(result.events);
      }
    });

    logger.info(`📊 Total events collected: ${allEvents.length}`);

    // Remove duplicates
    allEvents = removeDuplicates(allEvents);
    logger.info(`📊 After deduplication: ${allEvents.length} unique events`);

    // Filter out already processed events
    const newEvents = allEvents.filter(event => !processedKeys.has(event.sleutel));
    logger.info(`✨ New events to send: ${newEvents.length}`);

    if (newEvents.length === 0) {
      logger.info('✅ No new events found. Scraping complete.');
      return;
    }

    // Send new events to client endpoint
    logger.info(`📤 Sending ${newEvents.length} new events to endpoint...`);
    
    // Log first event structure for debugging
    if (newEvents.length > 0) {
      logger.info('📋 First event structure:');
      logger.info(JSON.stringify(newEvents[0], null, 2));
    }
    
    const sentCount = await httpService.sendEvents(newEvents);
    logger.success(`✅ Successfully sent ${sentCount}/${newEvents.length} events`);

    // Save processed event keys to database
    if (sentCount > 0) {
      logger.info('💾 Saving processed events to database...');
      const sentEventKeys = newEvents.slice(0, sentCount).map(e => e.sleutel);
      const savedCount = await supabaseService.saveProcessedEvents(sentEventKeys);
      logger.success(`✅ Saved ${savedCount} processed event keys`);
    }

    // Summary
    logger.info('');
    logger.info('═══════════════════════════════════════');
    logger.info('📊 SCRAPING SUMMARY');
    logger.info('═══════════════════════════════════════');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      logger.info(`${status} ${result.source}: ${result.events.length} events`);
    });
    logger.info(`📊 Total collected: ${allEvents.length}`);
    logger.info(`✨ New events: ${newEvents.length}`);
    logger.info(`📤 Sent: ${sentCount}`);
    logger.info('═══════════════════════════════════════');
    logger.info('');

  } catch (error) {
    logger.error('Fatal error during scraping', error);
    process.exit(1);
  }
}

/**
 * Schedule recurring execution
 */
function scheduleRecurring(): void {
  const intervalMs = config.scraper.intervalHours * 60 * 60 * 1000;
  
  logger.info(`⏰ Scheduling scraper to run every ${config.scraper.intervalHours} hours`);
  
  // Run immediately
  runScraper().catch(error => {
    logger.error('Scheduled scraper failed', error);
  });

  // Then run on schedule
  setInterval(() => {
    logger.info('⏰ Scheduled run starting...');
    runScraper().catch(error => {
      logger.error('Scheduled scraper failed', error);
    });
  }, intervalMs);
}

// Run based on command line argument
const args = process.argv.slice(2);

if (args.includes('--once')) {
  // Run once and exit
  runScraper()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (args.includes('--schedule')) {
  // Run on schedule
  scheduleRecurring();
} else {
  // Default: run once
  runScraper()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}