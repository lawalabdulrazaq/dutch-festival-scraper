import { BaseScraper } from './base.scraper';
import { DjguideScraper } from './djguide.scraper';
import { FestivalFansScraper } from './festivalfans.scraper';
import { TicketSwapScraper } from './ticketswap.scraper';
import { PartyflockScraper } from './partyflock.scraper';
import { ResidentAdvisorScraper } from './resident-advisor.scraper';
import { EventbriteScraper } from './eventbrite.scraper';
import { TimeOutScraper } from './timeout.scraper';
import { config } from '../config/config';
import { ScraperConfig } from '../types/event.types';

/**
 * Get all enabled scrapers
 */
export function getScrapers(): BaseScraper[] {
  const scrapers: BaseScraper[] = [];

  config.sources.forEach((sourceConfig: ScraperConfig) => {
    if (!sourceConfig.enabled) {
      return;
    }

    switch (sourceConfig.name.toLowerCase()) {
      case 'djguide':
        scrapers.push(new DjguideScraper(sourceConfig));
        break;
      case 'festivalfans':
        scrapers.push(new FestivalFansScraper(sourceConfig));
        break;
      case 'ticketswap':
        scrapers.push(new TicketSwapScraper(sourceConfig));
        break;
      case 'partyflock':
        scrapers.push(new PartyflockScraper(sourceConfig));
        break;
      case 'resident advisor':
        scrapers.push(new ResidentAdvisorScraper(sourceConfig));
        break;
      case 'eventbrite':
        scrapers.push(new EventbriteScraper(sourceConfig));
        break;
      case 'timeout':
        scrapers.push(new TimeOutScraper(sourceConfig));
        break;
      default:
        console.warn(`Unknown scraper: ${sourceConfig.name}`);
    }
  });

  return scrapers;
}

export { BaseScraper, DjguideScraper, FestivalFansScraper, TicketSwapScraper, PartyflockScraper, ResidentAdvisorScraper, EventbriteScraper, TimeOutScraper };