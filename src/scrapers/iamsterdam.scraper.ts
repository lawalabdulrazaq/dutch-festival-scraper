import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * IAmsterdam.com events scraper - Amsterdam tourism events
 */
export class IAmsterdamScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    try {
      const html = await httpService.fetchHtml(
        'https://www.iamsterdam.com/en/events',
        3
      );

      const $ = load(html);

      $('[class*="event"], [class*="listing"]').each((_, el) => {
        try {
          const nameEl = $(el).find('h2, h3, .title, [class*="name"]').first();
          const name = normalizeText(nameEl.text());

          const dateEl = $(el).find('time, .date, [class*="date"]').first();
          const date = dateEl.attr('datetime') || normalizeText(dateEl.text()) || '';

          const locationEl = $(el).find('[class*="location"], .venue').first();
          const location = normalizeText(locationEl.text()) || 'Amsterdam';

          if (name && date) {
            events.push(
              normalizeEvent(
                {
                  name,
                  date,
                  location,
                  organizer: 'Amsterdam Promotion',
                  contact: 'onbekend',
                  source: 'IAmsterdam.com',
                },
                this.config.url
              )
            );
          }
        } catch (error) {
          logger.debug('Error parsing IAmsterdam event');
        }
      });

    } catch (error) {
      logger.error('IAmsterdam scraper failed', error);
    }

    return events;
  }
}
