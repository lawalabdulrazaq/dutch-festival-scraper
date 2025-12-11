import crypto from 'crypto';

/**
 * Generate a unique hash key for event deduplication
 * Input: event_name + date + location
 */
export function generateEventHash(
  eventName: string,
  eventDate: string,
  location: string
): string {
  const normalized = `${eventName.toLowerCase().trim()}|${eventDate.trim()}|${location.toLowerCase().trim()}`;
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Generate a shorter slug for events (friendly readable hash)
 */
export function generateEventSlug(
  eventName: string,
  eventDate: string
): string {
  const date = eventDate.split('-')[0] || ''; // Extract year
  const nameSlug = eventName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  return `${nameSlug}-${date}`;
}

export default { generateEventHash, generateEventSlug };
