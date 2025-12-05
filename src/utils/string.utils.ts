/**
 * String utility functions for text processing
 */

/**
 * Generate unique key (sleutel) from event data
 */
export function generateSleutel(
  eventName: string,
  date: string,
  location: string
): string {
  const rawKey = `${eventName}-${date}-${location}`;

  return rawKey
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '')          // Remove leading/trailing dashes
    .substring(0, 100);               // Limit length
}

/**
 * Clean HTML entities and whitespace
 */
export function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract email from text
 */
export function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

/**
 * Extract phone number (Dutch format)
 */
export function extractPhone(text: string): string {
  const phoneRegex = /(\+31|0031|0)\s?[1-9](\s?\d){8}/;
  const match = text.match(phoneRegex);
  return match ? match[0].replace(/\s/g, '') : '';
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Remove duplicate events based on sleutel
 */
export function removeDuplicates<T extends { sleutel: string }>(events: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const event of events) {
    if (!seen.has(event.sleutel)) {
      seen.add(event.sleutel);
      unique.push(event);
    }
  }

  return unique;
}