import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { normalizeDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText, extractEmail } from '../utils/string.utils';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

/**
 * Scraper for Partyflock.nl
 * Scrapes parties, festivals, and events
 */
export class PartyflockScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[] = [];
    const $ = cheerio.load(html);

    try {
      // Partyflock uses event listing pages
      $('div[class*="event"], article[class*="event"], li[class*="event"]').each((_, element) => {
        try {
          const $el = $(element);
          
          // Extract event name
          let evenement_naam = cleanText(
            $el.find('a[href*="/party/"], a[href*="/event/"], h2, h3, .event-title').first().text()
          );
          
          if (!evenement_naam || evenement_naam.length < 3) return;
          
          // Extract date
          let dateText = $el.find('.date, .event-date, time, [datetime]').first().text().trim();
          if (!dateText) {
            dateText = $el.attr('data-date') || '';
          }
          
          const datum_evenement = normalizeDate(dateText);
          if (!datum_evenement || !isFutureDate(datum_evenement)) return;
          
          // Extract location
          const locatie_evenement = cleanText(
            $el.find('.location, .city, .venue, [class*="location"]').first().text()
          ) || 'Nederland';
          
          // Extract organizer
          const organizerText = cleanText(
            $el.find('.organizer, [class*="organizer"]').first().text()
          );
          
          // Extract contact
          const contactText = extractEmail(
            $el.find('[class*="contact"], [class*="email"]').text() || $el.text()
          ) || 'contact@partyflock.nl';
          
          const sleutel = generateSleutel(evenement_naam, datum_evenement, locatie_evenement);
          
          events.push({
            datum_evenement,
            evenement_naam,
            locatie_evenement,
            organisator: organizerText || 'Organisator onbekend',
            contact_organisator: contactText,
            bron: 'Partyflock.nl',
            duur_evenement: '1 dag',
            sleutel,
          });
        } catch (error) {
          // Skip problematic events
        }
      });

      logger.info(`Partyflock: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('Partyflock: Scraping failed', error);
      return [];
    }
  }
}
