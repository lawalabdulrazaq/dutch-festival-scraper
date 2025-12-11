import { FestivalEvent, ScraperResult } from '../types/event.types';
import { BaseScraper } from '../scrapers/base.scraper';
import { FestivalInfoScraper } from '../scrapers/festivalinfo.scraper';
import { PartyFlockScraper } from '../scrapers/partyflock.scraper';
import { TicketMasterScraper } from '../scrapers/ticketmaster.scraper';
import { IAmsterdamScraper } from '../scrapers/iamsterdam.scraper';
import { VisitNetherlandsScraper } from '../scrapers/visitnetherlands.scraper';
import { HollandScraper } from '../scrapers/holland.scraper';
import { UitAgendaScraper } from '../scrapers/uitagenda.scraper';
import { EventbriteScraper } from '../scrapers/eventbrite.scraper';
import { CityEventsScraper } from '../scrapers/cities.scraper';
import { MusicEventsScraper } from '../scrapers/music-events.scraper';
import { supabaseService } from '../services/supabase.service';
import { httpService } from '../services/http.service';
import { browserService } from '../services/browser.service';
import { deduplicateEvents } from '../utils/normalize';
import { logger } from '../utils/logger';
import { delay } from '../utils/delay';

/**
 * Full Sync Workflow
 * Scrapes all events from all sources and stores them in database
 * Should run once on first startup and can be triggered manually
 */
export class FullSyncWorkflow {
  private scrapers: BaseScraper[] = [];
  private maxEventsPerSource = 500;

  async initialize(): Promise<void> {
    logger.info('🚀 Initializing Full Sync Workflow...');

    const configs = [
      {
        name: 'FestivalInfo',
        url: 'https://www.festivalinfo.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'PartyFlock',
        url: 'https://www.partyflock.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'TicketMaster',
        url: 'https://www.ticketmaster.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'IAmsterdam',
        url: 'https://www.iamsterdam.com/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'VisitNetherlands',
        url: 'https://www.visitnetherlands.com/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'Holland.com',
        url: 'https://www.holland.com/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'UitAgenda',
        url: 'https://www.uitagenda.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'Eventbrite',
        url: 'https://www.eventbrite.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'City Events',
        url: 'https://cities.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'Music Events',
        url: 'https://music.nl/',
        enabled: true,
        timeout: 30000,
        retries: 3,
      },
    ];

    // Initialize all scrapers (testing access vs 404 errors)
    this.scrapers = [
      new FestivalInfoScraper(configs[0]),
      new PartyFlockScraper(configs[1]),
      new TicketMasterScraper(configs[2]),
      new IAmsterdamScraper(configs[3]),
      new VisitNetherlandsScraper(configs[4]),
      new HollandScraper(configs[5]),
      new UitAgendaScraper(configs[6]),
      new EventbriteScraper(configs[7]),
      new CityEventsScraper(configs[8]),
      new MusicEventsScraper(configs[9]),
    ];

    // Initialize browser for JS-rendered sites
    await browserService.initialize();

    logger.info(`✓ Initialized ${this.scrapers.length} scrapers`);
  }

  /**
   * Execute full sync: Scrape all events and store in database
   */
  async execute(): Promise<{
    totalEvents: number;
    saved: number;
    errors: number;
  }> {
    logger.info('📊 Starting Full Sync...');
    const startTime = Date.now();

    let totalEvents = 0;
    let totalSaved = 0;
    const results: ScraperResult[] = [];

    try {
      // Clear previous processed events for fresh start
      await supabaseService.clearAllProcessedEvents();

      // Run all scrapers
      for (const scraper of this.scrapers) {
        try {
          logger.info(`🕷️  Running scraper: ${scraper.config.name}`);
          const result = await scraper.execute();
          results.push(result);

          if (result.success) {
            totalEvents += result.events.length;
          }

          // Rate limiting
          await delay(2000);
        } catch (error) {
          logger.error(`Error running scraper`, error);
        }
      }

      // Deduplicate all events across sources
      const allEvents = results.flatMap(r => r.events);
      const uniqueEvents = deduplicateEvents(allEvents);

      logger.info(
        `📦 Collected ${allEvents.length} events, ${uniqueEvents.length} unique`
      );

      // Save to database in batches
      const batchSize = 50;
      for (let i = 0; i < uniqueEvents.length; i += batchSize) {
        const batch = uniqueEvents.slice(i, i + batchSize);
        const saved = await supabaseService.saveFestivalEvents(batch);
        totalSaved += saved;

        // Mark as processed
        const sleutels = batch.map(e => e.sleutel);
        await supabaseService.saveProcessedEvents(sleutels);

        // Rate limiting
        await delay(500);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(
        `✅ Full Sync Complete in ${duration}s: ${totalSaved} events saved`
      );

      return {
        totalEvents: uniqueEvents.length,
        saved: totalSaved,
        errors: results.length - results.filter(r => r.success).length,
      };

    } catch (error) {
      logger.error('Full Sync failed', error);
      throw error;
    } finally {
      // Close browser
      await browserService.close();
    }
  }
}

export const fullSyncWorkflow = new FullSyncWorkflow();
