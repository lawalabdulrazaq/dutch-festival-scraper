import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { normalizeDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { normalizeEvent } from '../utils/normalize';
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
          
          const event_date = normalizeDate(dateText);
          if (!event_date || !isFutureDate(event_date)) return;
          
          // Extract location
          let locatie_evenement = cleanText(
            $el.find('[class*="venue"], [class*="location"]').text()
          );
          
          if (!locatie_evenement) {
            locatie_evenement = 'Nederland';
          }
          
          // Extract organizer
          const organizerText = cleanText(
            $el.find('span, p').eq(1).text()
          );
          
          // Use normalizeEvent to ensure proper formatting and field names
          const event = normalizeEvent({
            name: evenement_naam,
            date: event_date,
            location: locatie_evenement,
            organizer: organizerText,
            contact: 'info@timeout.nl',
            source: 'TimeOut',
            duration: '1'
          });

          events.push(event);
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
