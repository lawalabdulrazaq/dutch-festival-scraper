import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { normalizeDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

/**
 * Scraper for Resident Advisor (RA.co)
 * Scrapes club events and electronic music festivals in Netherlands
 */
export class ResidentAdvisorScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[] = [];
    const $ = cheerio.load(html);

    try {
      // RA uses article tags for events
      $('article').each((_, element) => {
        try {
          const $el = $(element);
          
          // Extract event name from link
          let evenement_naam = cleanText(
            $el.find('a[href*="/event/"]').first().text()
          );
          
          if (!evenement_naam || evenement_naam.length < 3) return;
          
          // Extract date from p tags or data attributes
          let dateText = cleanText($el.find('p').eq(1).text()).trim();
          
          if (!dateText) {
            dateText = cleanText($el.find('p').text()).match(/\d{1,2}\s+\w+\s+\d{4}/)?.[0] || '';
          }
          
          const event_date = normalizeDate(dateText);
          if (!event_date || !isFutureDate(event_date)) return;
          
          // Extract location from article text
          const allText = cleanText($el.text());
          let locatie_evenement = allText.match(/Amsterdam|Rotterdam|Utrecht|Den Haag|Groningen|Leeuwarden|Maastricht|Eindhoven/)?.[0] || 'Nederland';
          
          // Extract organizer
          const organisator = cleanText(
            $el.find('a[href*="/promoter/"]').first().text()
          ) || 'Organisator onbekend';
          
          const sleutel = generateSleutel(evenement_naam, event_date, locatie_evenement);
          
          events.push({
            event_date,
            evenement_naam,
            locatie_evenement,
            organisator,
            contact_organisator: 'info@ra.co',
            bron: 'Resident Advisor',
            duur_evenement: 1,
            sleutel,
          });
        } catch (error) {
          // Skip problematic events
        }
      });

      logger.info(`Resident Advisor: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('Resident Advisor: Scraping failed', error);
      return [];
    }
  }
}
