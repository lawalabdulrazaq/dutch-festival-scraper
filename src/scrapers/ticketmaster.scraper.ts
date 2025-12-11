import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * TicketMaster.nl scraper - Major event platform
 */
export class TicketMasterScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    try {
      // TicketMaster Netherlands events
      const html = await httpService.fetchHtml(
        'https://www.ticketmaster.nl/events',
        3
      );

      const $ = load(html);

      // Parse events from listing
      $('[class*="event"], [data-event-id]').each((_, el) => {
        try {
          const nameEl = $(el).find('h3, h2, [class*="title"]').first();
          const name = normalizeText(nameEl.text());

          const dateEl = $(el).find('time, [class*="date"], [data-date]').first();
          const date = dateEl.attr('datetime') || normalizeText(dateEl.text()) || '';

          const locationEl = $(el).find('[class*="location"], [class*="venue"]').first();
          const location = normalizeText(locationEl.text());

          if (name && date) {
            const event = normalizeEvent(
              {
                name,
                date,
                location: location || 'onbekend',
                organizer: 'TicketMaster.nl',
                contact: 'onbekend',
                source: 'TicketMaster.nl',
              },
              this.config.url
            );

            events.push(event);
          }
        } catch (error) {
          logger.debug('Error parsing TicketMaster event');
        }
      });

    } catch (error) {
      logger.error('TicketMaster scraper failed', error);
    }

    return events;
  }
}
