import { FestivalEvent } from '../types/event.types';
import { BaseScraper } from '../scrapers/base.scraper';
import { FestivalInfoScraper } from '../scrapers/festivalinfo.scraper';
import { PartyFlockScraper } from '../scrapers/partyflock.scraper';
import { TicketMasterScraper } from '../scrapers/ticketmaster.scraper';
import { IAmsterdamScraper } from '../scrapers/iamsterdam.scraper';
import { VisitNetherlandsScraper } from '../scrapers/visitnetherlands.scraper';
import { HollandScraper } from '../scrapers/holland.scraper';
import { UitAgendaScraper } from '../scrapers/uitagenda.scraper';
import { EventbriteScraper } from '../scrapers/eventbrite.scraper';
import { supabaseService } from '../services/supabase.service';
import { httpService } from '../services/http.service';
import { browserService } from '../services/browser.service';
import { deduplicateEvents } from '../utils/normalize';
import { logger } from '../utils/logger';
import { delay, randomDelay } from '../utils/delay';
import { config } from '../config/config';

/**
 * Incremental Sync Workflow
 * Runs daily/periodically and sends only new or updated events to client
 * Compares sleutel against processed_events table
 */
export class IncrementalSyncWorkflow {
  private scrapers: BaseScraper[] = [];
  private clientEndpoint: string;
  private retryAttempts = 3;

  constructor() {
    this.clientEndpoint = config.client.endpoint;

    const configs = [
      { name: 'FestivalInfo', url: 'https://www.festivalinfo.nl/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'PartyFlock', url: 'https://www.partyflock.nl/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'TicketMaster', url: 'https://www.ticketmaster.nl/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'IAmsterdam', url: 'https://www.iamsterdam.com/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'VisitNetherlands', url: 'https://www.visitnetherlands.com/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'Holland.com', url: 'https://www.holland.com/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'UitAgenda', url: 'https://www.uitagenda.nl/', enabled: true, timeout: 30000, retries: 3 },
      { name: 'Eventbrite', url: 'https://www.eventbrite.nl/', enabled: true, timeout: 30000, retries: 3 },
    ];

    // Test all scrapers for access vs 404 errors
    this.scrapers = [
      new FestivalInfoScraper(configs[0]),
      new PartyFlockScraper(configs[1]),
      new TicketMasterScraper(configs[2]),
      new IAmsterdamScraper(configs[3]),
      new VisitNetherlandsScraper(configs[4]),
      new HollandScraper(configs[5]),
      new UitAgendaScraper(configs[6]),
      new EventbriteScraper(configs[7]),
    ];
  }

  /**
   * Execute incremental sync
   * Returns only new/updated events not in processed_events
   */
  async execute(): Promise<{
    newEvents: number;
    sent: number;
    errors: number;
  }> {
    logger.info('🔄 Starting Incremental Sync...');
    const startTime = Date.now();

    let newEventCount = 0;
    let sentCount = 0;
    let errorCount = 0;

    try {
      // Load processed events from database
      const processedKeys = await supabaseService.getProcessedEvents();
      logger.info(`📋 Loaded ${processedKeys.size} processed event keys`);

      // Initialize browser if needed
      if (!browserService.isRunning()) {
        await browserService.initialize();
      }

      // Run all scrapers
      const allScrapedEvents: FestivalEvent[] = [];

      for (const scraper of this.scrapers) {
        try {
          logger.debug(`Running ${scraper.config.name}...`);
          const result = await scraper.execute();

          if (result.success) {
            allScrapedEvents.push(...result.events);
          }

          await randomDelay(1000, 2000);
        } catch (error) {
          logger.error(`Error running ${scraper.config.name}`, error);
          errorCount++;
        }
      }

      // Deduplicate
      const uniqueEvents = deduplicateEvents(allScrapedEvents);
      logger.info(`✓ Got ${uniqueEvents.length} unique events from scrapers`);

      // Filter to only new events
      const newEvents = uniqueEvents.filter(
        event => !processedKeys.has(event.sleutel)
      );

      newEventCount = newEvents.length;
      logger.info(`🆕 Found ${newEventCount} new events`);

      if (newEventCount === 0) {
        logger.info('✓ No new events to send');
        return { newEvents: 0, sent: 0, errors: errorCount };
      }

      // Save new events to database
      await supabaseService.saveFestivalEvents(newEvents);

      // Send new events to client endpoint with retry logic
      for (const event of newEvents) {
        try {
          const success = await this.sendEventWithRetry(event);
          if (success) {
            sentCount++;
            // Mark as processed
            await supabaseService.saveProcessedEvent(event.sleutel);
          } else {
            errorCount++;
          }

          // Rate limiting to client
          await delay(100);
        } catch (error) {
          logger.error(`Error sending event ${event.sleutel}`, error);
          errorCount++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(
        `✅ Incremental Sync Complete in ${duration}s: ${sentCount}/${newEventCount} events sent`
      );

      return {
        newEvents: newEventCount,
        sent: sentCount,
        errors: errorCount,
      };

    } catch (error) {
      logger.error('Incremental Sync failed', error);
      throw error;
    } finally {
      // Keep browser running for next sync
      // await browserService.close();
    }
  }

  /**
   * Send event to client endpoint with retry logic
   */
  private async sendEventWithRetry(event: FestivalEvent): Promise<boolean> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const success = await httpService.sendEvent(event);
        if (success) {
          logger.debug(`✓ Sent event: ${event.evenement_naam}`);
          return true;
        }
      } catch (error) {
        logger.warn(`Attempt ${attempt}/${this.retryAttempts} failed for ${event.evenement_naam}`);
      }

      if (attempt < this.retryAttempts) {
        // Exponential backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        await delay(backoffMs);
      }
    }

    logger.error(`Failed to send event after ${this.retryAttempts} attempts: ${event.evenement_naam}`);
    return false;
  }
}

export const incrementalSyncWorkflow = new IncrementalSyncWorkflow();
