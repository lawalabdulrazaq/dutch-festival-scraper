import { FestivalEvent, RawEvent } from '../types/event.types';
import { generateEventHash } from './hash';
import { logger } from './logger';

/**
 * Calculate duration between two dates in days
 */
export function calculateDuration(
  startDate: string,
  endDate?: string
): number {
  try {
    const start = new Date(startDate);
    if (!endDate) {
      return 1; // Default to 1 day
    }

    // If endDate is a numeric string like '3' or '3 dagen', treat as number of days
    const numericMatch = endDate.toString().trim().match(/^(\d+)\b/);
    if (numericMatch) {
      const days = parseInt(numericMatch[1], 10);
      if (!isNaN(days) && days > 0) return days;
    }

    // Otherwise try to parse endDate as a date string
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(diffDays, 1);
    }

    // Fallback to 1 day if parsing fails
    return 1;
  } catch (error) {
    logger.debug(`Failed to calculate duration for ${startDate}-${endDate}`);
    return 1;
  }
}

/**
 * Normalize date to YYYY-MM-DD format
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Try to parse the date
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    logger.debug(`Failed to normalize date: ${dateStr}`);
  }

  // Return as-is if parsing fails
  return dateStr;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    logger.debug(`Failed to extract domain from ${url}`);
    return url;
  }
}

/**
 * Normalize whitespace in text
 */
export function normalizeText(text: string | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ');
}

/**
 * Convert raw event to FestivalEvent with proper formatting
 */
export function normalizeEvent(
  rawEvent: RawEvent,
  sourceUrl?: string
): FestivalEvent {
  const eventDate = normalizeDate(rawEvent.date);
  const location = normalizeText(
    rawEvent.location || rawEvent.venue || rawEvent.city || 'onbekend'
  );
  const organizer = normalizeText(rawEvent.organizer || 'onbekend');
  const contact = normalizeText(rawEvent.contact || 'onbekend');
  const bron = rawEvent.source || extractDomain(sourceUrl || '');

  const sleutel = generateEventHash(rawEvent.name, eventDate, location);

  return {
    datum_evenement: eventDate,
    evenement_naam: normalizeText(rawEvent.name),
    locatie_evenement: location,
    organisateur: organizer,
    contact_organisator: contact,
    bron: bron,
    duur_evenement: calculateDuration(eventDate, rawEvent.duration),
    sleutel: sleutel,
  };
}

/**
 * Parse date range string (e.g., "2024-01-15 - 2024-01-17")
 */
export function parseDateRange(
  dateRangeStr: string
): { start: string; end?: string } {
  const parts = dateRangeStr.split('-').map(p => p.trim());

  if (parts.length === 1) {
    return { start: normalizeDate(parts[0]) };
  }

  return {
    start: normalizeDate(parts[0]),
    end: normalizeDate(parts[parts.length - 1]),
  };
}

/**
 * Deduplicate events by sleutel
 */
export function deduplicateEvents(events: FestivalEvent[]): FestivalEvent[] {
  const seen = new Set<string>();
  return events.filter(event => {
    if (seen.has(event.sleutel)) {
      return false;
    }
    seen.add(event.sleutel);
    return true;
  });
}

export default {
  calculateDuration,
  normalizeDate,
  extractDomain,
  normalizeText,
  normalizeEvent,
  parseDateRange,
  deduplicateEvents,
};
