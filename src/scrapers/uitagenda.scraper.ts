import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';

/**
 * UitAgenda.nl scraper - Comprehensive Dutch event agenda
 */
export class UitAgendaScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    try {
      const html = await httpService.fetchHtml(
        'https://www.uitagenda.nl/agenda/',
        3
      );

      const $ = load(html);

      $('[class*="event"], [class*="article"], li, .item').each((_, el) => {
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
                  organizer: 'UitAgenda.nl',
                  contact: 'onbekend',
                  source: 'UitAgenda.nl',
                },
                this.config.url
              )
            );
          }
        } catch (error) {
          logger.debug('Error parsing UitAgenda event');
        }
      });

    } catch (error) {
      logger.error('UitAgenda scraper failed', error);
    }

    return events;
  }
}
