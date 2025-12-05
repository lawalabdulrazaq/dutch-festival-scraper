import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { parseShortDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { logger } from '../utils/logger';

/**
 * Scraper for Djguide.nl
 * Scrapes electronic music events and festivals
 */
export class DjguideScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[] = [];

    try {
      // DJGuide pattern: "SA 22 novEvent Name 23:00 Venue, City NL"
      const eventPattern = /(MO|TU|WE|TH|FR|SA|SU)\s+(\d+\s+\w+)(.*?)\s+(\d{2}:\d{2})\s+(.*?),\s+(.*?)\s+NL/gi;
      
      let match;
      let count = 0;
      const maxEvents = 1000;

      while ((match = eventPattern.exec(html)) !== null && count < maxEvents) {
        try {
          const dateStr = match[2].trim(); // "22 nov"
          const eventName = cleanText(match[3]); // Event name
          const time = match[4]; // "23:00"
          const venue = cleanText(match[5]); // Venue name
          const city = cleanText(match[6]); // City

          // Parse date
          const datum_evenement = parseShortDate(dateStr);

          // Skip if no valid data
          if (!datum_evenement || !eventName || eventName.length < 3) {
            continue;
          }

          // Only future events
          if (!isFutureDate(datum_evenement)) {
            continue;
          }

          const locatie_evenement = `${venue}, ${city}`;
          const sleutel = generateSleutel(eventName, datum_evenement, locatie_evenement);

          events.push({
            datum_evenement,
            evenement_naam: eventName,
            locatie_evenement,
            organisator: '',
            contact_organisator: '',
            bron: 'Djguide.nl',
            duur_evenement: '1 dag',
            sleutel,
          });

          count++;
        } catch (error) {
          // Skip problematic events
          continue;
        }
      }

      logger.info(`Djguide: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('Djguide: Scraping failed', error);
      return [];
    }
  }
}