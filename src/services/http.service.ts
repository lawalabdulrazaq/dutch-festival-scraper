import axios from 'axios';
import { config } from '../config/config';
import { FestivalEvent } from '../types/event.types';
import { logger } from '../utils/logger';
import { transformEventForClient } from '../utils/event-transform';

/**
 * HTTP service for making requests
 */
class HttpService {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      timeout: config.scraper.timeout,
      headers: {
        'User-Agent': config.scraper.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });
  }

  /**
   * Fetch HTML from URL with retries
   */
  async fetchHtml(url: string, retries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`Fetching ${url} (attempt ${attempt}/${retries})`);
        
        const response = await this.client.get(url);
        
        if (response.status === 200) {
          logger.debug(`Successfully fetched ${url}`);
          return response.data as string;
        }

      } catch (error: any) {
        if (attempt === retries) {
          const errorMessage = error?.message || 'Unknown error';
          logger.error(`Failed to fetch ${url} after ${retries} attempts`, errorMessage);
          throw error;
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.warn(`Retry ${attempt}/${retries} for ${url} in ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }

    throw new Error(`Failed to fetch ${url}`);
  }

  /**
   * Send event to client endpoint
   */
  async sendEvent(event: FestivalEvent): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured
      if (config.client.apiKey && config.client.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${config.client.apiKey}`;
      }

      // Transform event to client format (datum_evenement -> event_date, organisateur -> organisator)
      const clientEvent = transformEventForClient(event);

      logger.debug(`Sending to ${config.client.endpoint}`, {
        event: event.evenement_naam,
        headers: Object.keys(headers),
      });

      const response = await axios.post(
        config.client.endpoint,
        clientEvent,
        { headers, timeout: 10000 }
      );

      if (response.status >= 200 && response.status < 300) {
        logger.debug(`✓ Sent event: ${event.evenement_naam}`);
        return true;
      }

      logger.warn(`Failed to send event: ${response.status}`);
      return false;

    } catch (error: any) {
      const status = error?.response?.status || error?.code || 'Unknown';
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      logger.error(`Error sending event: ${event.evenement_naam}`, `Status: ${status}, Message: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Send multiple events in batch
   */
  async sendEvents(events: FestivalEvent[]): Promise<number> {
    let successCount = 0;

    for (const event of events) {
      const success = await this.sendEvent(event);
      if (success) {
        successCount++;
      }

      // Rate limiting: wait 100ms between requests
      await this.delay(100);
    }

    return successCount;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const httpService = new HttpService();