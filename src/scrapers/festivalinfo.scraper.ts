import { load } from 'cheerio';
import { BaseScraper } from './base.scraper';
import { FestivalEvent, ScraperConfig } from '../types/event.types';
import { normalizeEvent } from '../utils/normalize';
import { extractContactInfo } from '../utils/contact-extractor';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';
import { randomDelay } from '../utils/delay';

/**
 * FestivalInfo.nl scraper - Comprehensive Dutch festival database
 * Static HTML with event listings
 */
export class FestivalInfoScraper extends BaseScraper {
  private baseUrl = 'https://www.festivalinfo.nl';

  constructor(config: ScraperConfig) {
    super(config);
  }

  async scrape(): Promise<FestivalEvent[]> {
    const events: FestivalEvent[] = [];

    try {
      // Fetch festival listings page
      const html = await httpService.fetchHtml(
        `${this.baseUrl}/festivals/`,
        3
      );

      const $ = load(html);

      // Extract festival links (resolve relative and absolute URLs)
      const festivalLinks: string[] = [];
      $('a[href*="/festival/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        try {
          // Use URL to resolve relative hrefs against baseUrl
          const resolved = new URL(href, this.baseUrl).toString();
          if (resolved.includes('/festival/')) {
            festivalLinks.push(resolved);
          }
        } catch (err) {
          // Fallback: join naively if URL constructor fails
          const joined = href.startsWith('/') ? `${this.baseUrl}${href}` : `${this.baseUrl}/${href}`;
          if (joined.includes('/festival/')) festivalLinks.push(joined);
        }
      });

      logger.debug(`Found ${festivalLinks.length} festival links on FestivalInfo`);

      // Limit to avoid too many requests
      const limit = Math.min(festivalLinks.length, 100);

      for (let i = 0; i < limit; i++) {
        try {
          await randomDelay(500, 1500);
          const eventHtml = await httpService.fetchHtml(festivalLinks[i], 2);
          const event = this.parseFestivalDetail(eventHtml);

          if (event && event.evenement_naam !== 'onbekend') {
            events.push(event);
          }
        } catch (error) {
          logger.debug(`Failed to parse festival detail: ${festivalLinks[i]}`);
          continue;
        }
      }

    } catch (error) {
      logger.error('FestivalInfo scraper failed', error);
    }

    return events;
  }

  private parseFestivalDetail(html: string): FestivalEvent | null {
    try {
      const $ = load(html);

      const name =
        $('h1').first().text() ||
        $('[class*="title"]').first().text() ||
        'onbekend';

      const dateText = $('[class*="date"], time').first().text() || '';

      const location =
        $('[class*="location"], [class*="plaats"], [class*="city"]')
          .first()
          .text() || 'onbekend';

      const contactText = $('[class*="contact"], [class*="organisator"]')
        .text();
      const contact = extractContactInfo(contactText) || 'onbekend';

      if (!name || name === 'onbekend') {
        return null;
      }

      return normalizeEvent(
        {
          name: name.trim(),
          date: dateText.trim() || new Date().toISOString().split('T')[0],
          location: location.trim(),
          organizer: 'festivalinfo.nl',
          contact: contact,
          source: 'FestivalInfo.nl',
        },
        this.config.url
      );
    } catch (error) {
      logger.debug('Error parsing festival detail', error);
      return null;
    }
  }
}
