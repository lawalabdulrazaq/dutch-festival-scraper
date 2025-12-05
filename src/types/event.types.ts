/**
 * Standard event format that matches client requirements
 */
export interface FestivalEvent {
  datum_evenement: string;        // YYYY-MM-DD format
  evenement_naam: string;          // Event name
  locatie_evenement: string;       // Location (venue, city)
  organisator: string;             // Organizer name
  contact_organisator: string;     // Contact email/phone
  bron: string;                    // Source (e.g., "Djguide.nl")
  duur_evenement: string;          // Duration (e.g., "1 dag", "2 dagen")
  sleutel: string;                 // Unique key for deduplication
}

/**
 * Raw scraped event before normalization
 */
export interface RawEvent {
  name: string;
  date: string;
  location: string;
  venue?: string;
  city?: string;
  organizer?: string;
  contact?: string;
  duration?: string;
  source: string;
}

/**
 * Processed event stored in database
 */
export interface ProcessedEvent {
  sleutel: string;
  processed_at: string;
}

/**
 * Scraper result
 */
export interface ScraperResult {
  source: string;
  events: FestivalEvent[];
  success: boolean;
  error?: string;
  scrapedAt: Date;
}

/**
 * Configuration for each scraper
 */
export interface ScraperConfig {
  name: string;
  url: string;
  enabled: boolean;
  timeout: number;
  retries: number;
}