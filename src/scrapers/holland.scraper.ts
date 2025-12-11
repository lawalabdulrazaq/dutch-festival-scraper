import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * Holland.com events scraper
 */
export class HollandScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    try {
      const html = await httpService.fetchHtml(
        'https://www.holland.com/en/tourism/events-and-festivals.htm',
        3
      );

      const $ = load(html);

      $('[class*="event"], [class*="festival"], .item, article').each((_, el) => {
        try {
          const nameEl = $(el).find('h2, h3, .title, a').first();
          const name = normalizeText(nameEl.text());

          const dateEl = $(el).find('time, .date, [class*="date"]').first();
          const date = dateEl.attr('datetime') || normalizeText(dateEl.text()) || '';

          const locationEl = $(el).find('[class*="location"], .city, .venue').first();
          const location = normalizeText(locationEl.text()) || 'Holland';

          if (name && date) {
            events.push(
              normalizeEvent(
                {
                  name,
                  date,
                  location,
                  organizer: 'Holland.com',
                  contact: 'onbekend',
                  source: 'Holland.com',
                },
                this.config.url
              )
            );
          }
        } catch (error) {
          logger.debug('Error parsing Holland.com event');
        }
      });

    } catch (error) {
      logger.error('Holland.com scraper failed', error);
    }

    return events;
  }
}
