import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { normalizeDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

/**
 * Scraper for TimeOut Netherlands
 * Scrapes cultural events, exhibitions, theater, cinema, and entertainment
 */
export class TimeOutScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[] = [];
    const $ = cheerio.load(html);

    try {
      // TimeOut.nl agenda page structure
      $('div[data-id], article[data-id], li[data-test]').each((_, element) => {
        try {
          const $el = $(element);
          
          // Extract event name
          let evenement_naam = cleanText(
            $el.find('h3, h2, a').first().text()
          );
          
          if (!evenement_naam || evenement_naam.length < 3) return;
          
          // Extract date from text
          const fullText = cleanText($el.text());
          let dateText = fullText.match(/\d{1,2}\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4}/i)?.[0] || 
                        fullText.match(/\d{1,2}\s+\w+/)?.[0] || '';
          
          // Try English month names
          if (!dateText) {
            dateText = fullText.match(/\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i)?.[0] || '';
          }
          
          const datum_evenement = normalizeDate(dateText);
          if (!datum_evenement || !isFutureDate(datum_evenement)) return;
          
          // Extract location
          let locatie_evenement = cleanText(
            $el.find('[class*="venue"], [class*="location"]').text()
          );
          
          if (!locatie_evenement) {
            locatie_evenement = 'Nederland';
          }
          
          // Extract organizer
          const organisator = cleanText(
            $el.find('span, p').eq(1).text()
          ) || 'Organisator onbekend';
          
          const sleutel = generateSleutel(evenement_naam, datum_evenement, locatie_evenement);
          
          events.push({
            datum_evenement,
            evenement_naam,
            locatie_evenement,
            organisator,
            contact_organisator: 'info@timeout.nl',
            bron: 'TimeOut',
            duur_evenement: '1 dag',
            sleutel,
          });
        } catch (error) {
          // Skip problematic events
        }
      });

      logger.info(`TimeOut: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('TimeOut: Scraping failed', error);
      return [];
    }
  }
}
