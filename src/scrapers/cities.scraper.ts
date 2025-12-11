import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent, normalizeText } from '../utils/normalize';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * Multi-city scraper: Amsterdam, Rotterdam, Utrecht, The Hague, etc.
 * Scrapes official city event portals
 */
export class CityEventsScraper extends BaseScraper {
  private cities = [
    { name: 'Amsterdam', url: 'https://www.amsterdam.nl/en/events/' },
    { name: 'Rotterdam', url: 'https://www.rotterdam.nl/events/' },
    { name: 'Utrecht', url: 'https://www.utrecht.nl/uitagenda/' },
    { name: 'The Hague', url: 'https://www.denhaag.nl/en/events/' },
    { name: 'Eindhoven', url: 'https://www.eindhoven.nl/events/' },
    { name: 'Arnhem', url: 'https://www.arnhem.nl/evenementen/' },
    { name: 'Groningen', url: 'https://www.groningen.nl/events/' },
  ];

  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    for (const city of this.cities) {
      try {
        await randomDelay(500, 1500);
        const html = await httpService.fetchHtml(city.url, 2);
        const cityEvents = this.parseEvents(html, city.name);
        events.push(...cityEvents);
      } catch (error) {
        logger.debug(`Failed to scrape events for ${city.name}`);
      }
    }

    return events;
  }

  private parseEvents(html: string, cityName: string): FestivalEvent[] {
    const events: FestivalEvent[] = [];

    try {
      const $ = load(html);

      $('[class*="event"], article, .event-item, li[class*="event"]').each(
        (_, el) => {
          try {
            const nameEl = $(el).find('h2, h3, .title, a[href*="event"]').first();
            const name = normalizeText(nameEl.text());

            const dateEl = $(el).find('time, .date, [class*="date"]').first();
            const date =
              dateEl.attr('datetime') ||
              normalizeText(dateEl.text()) ||
              '';

            const locationEl = $(el).find('[class*="location"], .venue').first();
            const location = normalizeText(locationEl.text()) || cityName;

            if (name && date) {
              events.push(
                normalizeEvent(
                  {
                    name,
                    date,
                    location,
                    organizer: `${cityName} Municipality`,
                    contact: 'onbekend',
                    source: `${cityName} Events`,
                  },
                  this.config.url
                )
              );
            }
          } catch (error) {
            logger.debug(`Error parsing event for ${cityName}`);
          }
        }
      );
    } catch (error) {
      logger.error(`Failed to parse events for ${cityName}`, error);
    }

    return events;
  }
}
