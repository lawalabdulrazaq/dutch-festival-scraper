import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { normalizeEvent } from '../utils/normalize';
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
          const event_date = match[2] || '';
          const city = cleanText(match[3] || 'Nederland');

          // Validate
          if (!evenement_naam || evenement_naam.length < 3) continue;
          if (!event_date || !isFutureDate(event_date)) continue;

          const locatie_evenement = city;
          
          // Use normalizeEvent to ensure proper formatting and field names
          const event = normalizeEvent({
            name: evenement_naam,
            date: event_date,
            location: locatie_evenement,
            organizer: 'TicketSwap',
            contact: 'ticketswap@ticketswap.nl',
            source: 'TicketSwap.nl',
            duration: '1'
          });

          const sleutel = event.sleutel;

          // Avoid duplicates on same page
          if (processedSleutels.has(sleutel)) continue;
          processedSleutels.add(sleutel);

          events.push(event);
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