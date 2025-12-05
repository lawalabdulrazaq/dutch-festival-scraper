import dotenv from 'dotenv';
import { ScraperConfig } from '../types/event.types';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },

  // Client endpoint
  client: {
    endpoint: process.env.CLIENT_ENDPOINT || '',
    apiKey: process.env.CLIENT_API_KEY || '',
  },

  // Scraper settings
  scraper: {
    intervalHours: parseInt(process.env.SCRAPE_INTERVAL_HOURS || '2'),
    maxEventsPerSource: parseInt(process.env.MAX_EVENTS_PER_SOURCE || '1000'),
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Sources configuration
  sources: [
    {
      name: 'FestivalFans',
      url: 'https://festivalfans.nl/agenda/',
      enabled: true,
      timeout: 30000,
      retries: 3,
    },
    {
      name: 'TicketSwap',
      url: 'https://www.ticketswap.com/netherlands',
      enabled: true,
      timeout: 30000,
      retries: 3,
    },
    {
      name: 'Resident Advisor',
      url: 'https://ra.co/events/nl/netherlands',
      enabled: false,  // Disabled: 403 Forbidden (Datadome protection)
      timeout: 30000,
      retries: 3,
    },
    {
      name: 'Eventbrite',
      url: 'https://www.eventbrite.nl/e/',
      enabled: false,  // Disabled: uses heavy JavaScript rendering
      timeout: 30000,
      retries: 3,
    },
    {
      name: 'TimeOut',
      url: 'https://www.timeout.nl/agenda',
      enabled: false,  // Disabled: 404 Not Found
      timeout: 30000,
      retries: 3,
    },
    {
      name: 'Djguide',
      url: 'https://www.djguide.nl/events.p?language=en',
      enabled: false,  // Disabled: uses client-side rendering, needs JavaScript support
      timeout: 30000,
      retries: 3,
    },
    {
      name: 'Partyflock',
      url: 'https://www.partyflock.nl/parties',
      enabled: false,
      timeout: 30000,
      retries: 3,
    },
  ] as ScraperConfig[],
};

/**
 * Validate configuration
 */
export function validateConfig(): boolean {
  const errors: string[] = [];

  if (!config.supabase.url) {
    errors.push('SUPABASE_URL is required');
  }

  if (!config.supabase.serviceKey) {
    errors.push('SUPABASE_SERVICE_KEY is required');
  }

  if (!config.client.endpoint) {
    errors.push('CLIENT_ENDPOINT is required');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    return false;
  }

  return true;
}