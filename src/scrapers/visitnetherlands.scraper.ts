import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * VisitNetherlands.com scraper - National tourism events
 */
export class VisitNetherlandsScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    try {
      const html = await httpService.fetchHtml(
        'https://www.visitnetherlands.com/things-to-do/events',
        3
      );

      const $ = load(html);

      $('[class*="event"], article, .event-item').each((_, el) => {
        try {
          const nameEl = $(el).find('h2, h3, .title, a[href*="event"]').first();
          const name = normalizeText(nameEl.text());

          const dateEl = $(el).find('time, .date, [class*="date"]').first();
          const date = dateEl.attr('datetime') || normalizeText(dateEl.text()) || '';

          const locationEl = $(el).find('[class*="location"], .city').first();
          const location = normalizeText(locationEl.text()) || 'Netherlands';

          if (name && date) {
            events.push(
              normalizeEvent(
                {
                  name,
                  date,
                  location,
                  organizer: 'VisitNetherlands',
                  contact: 'onbekend',
                  source: 'VisitNetherlands.com',
                },
                this.config.url
              )
            );
          }
        } catch (error) {
          logger.debug('Error parsing VisitNetherlands event');
        }
      });

    } catch (error) {
      logger.error('VisitNetherlands scraper failed', error);
    }

    return events;
  }
}
