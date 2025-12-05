import { FestivalEvent, ScraperResult, ScraperConfig } from '../types/event.types';
import { httpService } from '../services/http.service';
import { logger } from '../utils/logger';

/**
 * Abstract base class for all scrapers
 */
export abstract class BaseScraper {
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Main scraping method - must be implemented by child classes
   */
  abstract scrape(): Promise<FestivalEvent[]>;

  /**
   * Execute scraper with error handling
   */
  async execute(): Promise<ScraperResult> {
    const startTime = Date.now();
    logger.info(`🕷️  Starting ${this.config.name} scraper...`);

    try {
      const events = await this.scrape();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logger.success(
        `${this.config.name}: Found ${events.length} events in ${duration}s`
      );

      return {
        source: this.config.name,
        events,
        success: true,
        scrapedAt: new Date(),
      };

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.error(`${this.config.name}: Failed after ${duration}s`, error);

      return {
        source: this.config.name,
        events: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        scrapedAt: new Date(),
      };
    }
  }

  /**
   * Fetch HTML from scraper URL
   */
  protected async fetchHtml(): Promise<string> {
    return httpService.fetchHtml(this.config.url, this.config.retries);
  }
}