import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { normalizeDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

/**
 * Scraper for FestivalFans.nl
 * Scrapes music festivals and large events
 */
export class FestivalFansScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[]  = [];
    const $ = cheerio.load(html);

    try {
      // FestivalFans uses article tags or festival cards
      $('article, .festival-item, .event-item, [class*="festival"]').each((_, element) => {
        try {
          const $el = $(element);
          
          // Extract event name (look for h2, h3, or title class)
          let evenement_naam = cleanText(
            $el.find('h2, h3, .title, .festival-name, a[href*="/festival/"]').first().text()
          );
          
          if (!evenement_naam || evenement_naam.length < 3) return;
          
          // Extract date
          let dateText = $el.find('.date, .datum, time, [class*="date"]').first().text().trim();
          if (!dateText) {
            // Try to find date in the link or nearby text
            dateText = $el.text().match(/\d{1,2}\s+\w+\s+\d{4}/)?.[0] || '';
          }
          
          const event_date = normalizeDate(dateText);
          if (!event_date || !isFutureDate(event_date)) return;
          
          // Extract location
          const locatie_evenement = cleanText(
            $el.find('.location, .plaats, .venue').first().text()
          ) || 'Nederland';
          
          // Extract organizer and contact info
          const organizerText = cleanText(
            $el.find('.organizer, .organisator, [class*="organizer"]').first().text()
          );
          
          const contactText = cleanText(
            $el.find('.contact, .email, [class*="contact"]').first().text()
          );
          
          const sleutel = generateSleutel(evenement_naam, event_date, locatie_evenement);
          
          events.push({
            event_date,
            evenement_naam,
            locatie_evenement,
            organisator: organizerText || 'Organisator onbekend',
            contact_organisator: contactText || 'info@festivalalfans.nl',
            bron: 'FestivalFans.nl',
            duur_evenement: 1,
            sleutel,
          });
        } catch (error) {
          // Skip problematic events
        }
      });

      logger.info(`FestivalFans: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('FestivalFans: Scraping failed', error);
      return [];
    }
  }
}