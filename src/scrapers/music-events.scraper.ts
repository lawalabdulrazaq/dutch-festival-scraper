import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * Specialized music and cultural events scraper
 * Covers: DutchMusic.nl, Resident Advisor, DJ Guide, etc.
 */
export class MusicEventsScraper extends BaseScraper {
  private sources = [
    {
      name: 'DutchMusic.nl',
      url: 'https://www.dutchmusic.nl/events/',
    },
    {
      name: 'Resident Advisor NL',
      url: 'https://www.residentadvisor.net/events/nl',
    },
  ];

  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    for (const source of this.sources) {
      try {
        await randomDelay(1000, 2000);
        const html = await httpService.fetchHtml(source.url, 2);
        const sourceEvents = this.parseEvents(html, source.name);
        events.push(...sourceEvents);
      } catch (error) {
        logger.debug(`Failed to scrape music events from ${source.name}`);
      }
    }

    return events;
  }

  private parseEvents(html: string, sourceName: string): FestivalEvent[] {
    const events: FestivalEvent[] = [];

    try {
      const $ = load(html);

      $('[class*="event"], article, .event-item, .event-row, li[class*="event"]').each(
        (_, el) => {
          try {
            const nameEl = $(el)
              .find('h2, h3, .title, a[href*="event"]')
              .first();
            const name = normalizeText(nameEl.text());

            const dateEl = $(el).find('time, .date, [class*="date"]').first();
            const date =
              dateEl.attr('datetime') ||
              normalizeText(dateEl.text()) ||
              '';

            const locationEl = $(el)
              .find('[class*="location"], .venue, .city')
              .first();
            const location = normalizeText(locationEl.text()) || 'Netherlands';

            if (name && date) {
              events.push(
                normalizeEvent(
                  {
                    name,
                    date,
                    location,
                    organizer: sourceName,
                    contact: 'onbekend',
                    source: sourceName,
                  },
                  this.config.url
                )
              );
            }
          } catch (error) {
            logger.debug(`Error parsing event from ${sourceName}`);
          }
        }
      );
    } catch (error) {
      logger.error(`Failed to parse events from ${sourceName}`, error);
    }

    return events;
  }
}
