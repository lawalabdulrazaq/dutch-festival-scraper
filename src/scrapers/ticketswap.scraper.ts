import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { logger } from '../utils/logger';

/**
 * Scraper for TicketSwap.nl/com
 * Scrapes events from GraphQL data embedded in the page
 */
export class TicketSwapScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[] = [];

    try {
      // TicketSwap embeds full event data in the page as JSON
      // Find the event names and dates with cities
      const processedSleutels = new Set<string>();

      // Extract event data using regex patterns for name, date, and city
      // Pattern: "name":"EventName"..."startDate":"2025-12-03..."..."name":"CityName"
      
      // First, try to find individual event objects in GraphQL response
      const eventMatches = html.matchAll(/"__typename":"Event".*?"name":"([^"]+)".*?"startDate":"(\d{4}-\d{2}-\d{2})[^"]*".*?"city":\{"[^}]*"name":"([^"]+)"/gms);
      
      for (const match of eventMatches) {
        try {
          const evenement_naam = cleanText(match[1] || '');
          const datum_evenement = match[2] || '';
          const city = cleanText(match[3] || 'Nederland');

          // Validate
          if (!evenement_naam || evenement_naam.length < 3) continue;
          if (!datum_evenement || !isFutureDate(datum_evenement)) continue;

          const locatie_evenement = city;
          const sleutel = generateSleutel(evenement_naam, datum_evenement, locatie_evenement);

          // Avoid duplicates on same page
          if (processedSleutels.has(sleutel)) continue;
          processedSleutels.add(sleutel);

          events.push({
            datum_evenement,
            evenement_naam,
            locatie_evenement,
            organisator: 'TicketSwap',
            contact_organisator: 'ticketswap@ticketswap.nl',
            bron: 'TicketSwap.nl',
            duur_evenement: '1 dag',
            sleutel,
          });
        } catch (error) {
          // Skip problematic matches
        }
      }

      logger.info(`TicketSwap: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('TicketSwap: Scraping failed', error);
      return [];
    }
  }
}