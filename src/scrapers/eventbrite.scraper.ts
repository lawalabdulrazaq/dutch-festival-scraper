import { BaseScraper } from './base.scraper';
import { FestivalEvent } from '../types/event.types';
import { normalizeDate, isFutureDate } from '../utils/date.utils';
import { generateSleutel, cleanText } from '../utils/string.utils';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

/**
 * Scraper for Eventbrite Netherlands
 * Scrapes all types of events: concerts, conferences, workshops, etc.
 */
export class EventbriteScraper extends BaseScraper {
  async scrape(): Promise<FestivalEvent[]> {
    const html = await this.fetchHtml();
    const events: FestivalEvent[] = [];
    const $ = cheerio.load(html);

    try {
      // Eventbrite uses div cards for events
      $('div[data-qa="event-card"], div[class*="eventCard"], article[class*="event"]').each((_, element) => {
        try {
          const $el = $(element);
          
          // Extract event name
          let evenement_naam = cleanText(
            $el.find('h2, h3, a[href*="/events/"], .event-title, [class*="title"]').first().text()
          );
          
          if (!evenement_naam || evenement_naam.length < 3) return;
          
          // Extract date
          let dateText = $el.find('.date, .event-date, time, [class*="date"]').first().text().trim();
          
          // Try to find date in data attributes
          if (!dateText) {
            dateText = $el.find('[data-date]').attr('data-date') || 
                      $el.find('[data-start-time]').attr('data-start-time') || '';
          }
          
          // Extract day/month/year from Eventbrite format
          if (!dateText) {
            const dayEl = $el.find('[class*="date"], [class*="day"]').text();
            const monthEl = $el.find('[class*="month"]').text();
            const yearEl = $el.find('[class*="year"]').text();
            if (dayEl && monthEl) {
              dateText = `${dayEl} ${monthEl} ${yearEl}`.trim();
            }
          }
          
          const event_date = normalizeDate(dateText);
          if (!event_date || !isFutureDate(event_date)) return;
          
          // Extract location
          let locatie_evenement = cleanText(
            $el.find('.location, .venue, [class*="location"]').first().text()
          );
          
          // If not found, try alternative selectors
          if (!locatie_evenement) {
            locatie_evenement = cleanText(
              $el.find('.js-location, [data-location]').first().text()
            ) || 'Nederland';
          }
          
          // Extract organizer
          const organisator = cleanText(
            $el.find('.organizer, [class*="organizer"]').first().text()
          ) || cleanText(
            $el.find('a[href*="/organizer/"]').text()
          ) || 'Organisator onbekend';
          
          // Extract contact (try to find organizer link or email)
          const organizerLink = $el.find('a[href*="/organizer/"]').attr('href') || '';
          const contactText = organizerLink ? `https://eventbrite.nl${organizerLink}` : '';
          
          const sleutel = generateSleutel(evenement_naam, event_date, locatie_evenement);
          
          events.push({
            event_date,
            evenement_naam,
            locatie_evenement,
            organisator,
            contact_organisator: contactText || 'info@eventbrite.nl',
            bron: 'Eventbrite',
            duur_evenement: 1,
            sleutel,
          });
        } catch (error) {
          // Skip problematic events
        }
      });

      logger.info(`Eventbrite: Extracted ${events.length} events`);
      return events;

    } catch (error) {
      logger.error('Eventbrite: Scraping failed', error);
      return [];
    }
  }
}
