import express, { Request, Response } from 'express';
import cors from 'cors';
import { validateConfig, config } from './config/config';
import { getScrapers } from './scrapers';
import { supabaseService } from './services/supabase.service';
import { httpService } from './services/http.service';
import { FestivalEvent } from './types/event.types';
import { removeDuplicates } from './utils/string.utils';
import { logger } from './utils/logger';

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Main scraping logic (shared with CLI)
 */
async function runScraper(scrapeOnly?: string): Promise<{ success: boolean; events: FestivalEvent[]; sent: number; error?: string }> {
  try {
    // Load processed events from database
    const processedKeys = await supabaseService.getProcessedEvents();

    // Get all enabled scrapers
    let scrapers = getScrapers();

    // Filter by SCRAPE_ONLY if provided
    if (scrapeOnly) {
      const wanted = scrapeOnly.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      scrapers = scrapers.filter(s => wanted.includes((s as any).config.name.toLowerCase()));
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

    // Remove duplicates
    allEvents = removeDuplicates(allEvents);

    // Filter out already processed events
    const newEvents = allEvents.filter(event => !processedKeys.has(event.sleutel));

    if (newEvents.length === 0) {
      logger.info('No new events to send');
      return { success: true, events: [], sent: 0 };
    }

    // Send new events to client endpoint
    logger.info(`Sending ${newEvents.length} new events to endpoint...`);
    const sentCount = await httpService.sendEvents(newEvents);

    // Save processed event keys to database
    if (sentCount > 0) {
      const sentEventKeys = newEvents.slice(0, sentCount).map(e => e.sleutel);
      await supabaseService.saveProcessedEvents(sentEventKeys);
    }

    return {
      success: true,
      events: newEvents,
      sent: sentCount,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Scraper error', msg);
    return {
      success: false,
      events: [],
      sent: 0,
      error: msg,
    };
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Trigger scraper via HTTP POST (incremental - only NEW events)
 * Body (optional):
 * {
 *   "scrapeOnly": "FestivalFans,TicketSwap"  // comma-separated scraper names
 * }
 */
app.post('/run', async (req: Request, res: Response) => {
  logger.info('📡 HTTP /run endpoint called - incremental sync (new events only)');
  
  const scrapeOnly = req.body?.scrapeOnly || req.query?.scrapeOnly || undefined;
  
  const result = await runScraper(scrapeOnly);
  
  res.json({
    success: result.success,
    eventsCollected: result.events.length,
    eventsSent: result.sent,
    error: result.error || null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Full synchronization endpoint (INITIAL LOAD - sends ALL events without dedup)
 * Use this once to populate your database with all ~1200 Dutch festivals
 * Warning: This will send many events. Only run once for initial setup!
 * Body (optional):
 * {
 *   "scrapeOnly": "FestivalFans,TicketSwap"  // comma-separated scraper names
 * }
 */
app.post('/sync-all', async (req: Request, res: Response) => {
  logger.info('⚠️  HTTP /sync-all endpoint called - FULL synchronization (ALL events)');
  
  try {
    // Get all enabled scrapers
    let scrapers = getScrapers();
    const scrapeOnly = req.body?.scrapeOnly || req.query?.scrapeOnly || undefined;

    // Filter by SCRAPE_ONLY if provided
    if (scrapeOnly) {
      const wanted = scrapeOnly.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      scrapers = scrapers.filter((s: any) => wanted.includes((s as any).config.name.toLowerCase()));
    }

    // Run all scrapers in parallel
    const results = await Promise.all(
      scrapers.map(scraper => scraper.execute())
    );

    // Collect all events WITHOUT filtering for duplicates
    let allEvents: FestivalEvent[] = [];
    results.forEach(result => {
      if (result.success) {
        allEvents = allEvents.concat(result.events);
      }
    });

    // Remove duplicates from this run only
    allEvents = removeDuplicates(allEvents);

    logger.info(`Sending ${allEvents.length} total events to endpoint (full sync)...`);
    const sentCount = await httpService.sendEvents(allEvents);

    // Mark all as processed
    if (sentCount > 0) {
      const eventKeys = allEvents.slice(0, sentCount).map(e => e.sleutel);
      await supabaseService.saveProcessedEvents(eventKeys);
    }

    res.json({
      success: true,
      message: 'Full synchronization complete',
      eventsSent: sentCount,
      eventsCollected: allEvents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Full sync error', msg);
    res.status(500).json({
      success: false,
      error: msg,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;

if (!validateConfig()) {
  logger.error('Invalid configuration');
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info(`🚀 Dutch Festival Scraper HTTP server running on port ${PORT}`);
  logger.info(`POST http://localhost:${PORT}/run to trigger scraper`);
  logger.info(`GET http://localhost:${PORT}/health for health check`);
});
