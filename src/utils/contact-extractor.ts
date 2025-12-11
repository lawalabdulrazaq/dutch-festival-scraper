import { logger } from './logger';

/**
 * Extract contact information from HTML text
 * Looks for phone numbers, email addresses, and contact details
 */
export function extractContactInfo(htmlText: string): string {
  if (!htmlText) return 'onbekend';

  // Email pattern
  const emailMatch = htmlText.match(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
  );
  if (emailMatch && emailMatch.length > 0) {
    return emailMatch[0];
  }

  // Phone number patterns (Dutch)
  const phonePatterns = [
    /(\+31|0031|0)[\s]?[1-9][\s]?[0-9]{7,8}/g, // Standard Dutch
    /(\d{3,4}[-\s]?){2}\d{3,4}/g, // General format
  ];

  for (const pattern of phonePatterns) {
    const phoneMatch = htmlText.match(pattern);
    if (phoneMatch && phoneMatch.length > 0) {
      return phoneMatch[0].trim();
    }
  }

  return 'onbekend';
}

/**
 * Extract contact info from multiple text sources
 * Returns first found contact or "onbekend"
 */
export function extractContactFromMultipleSources(
  ...sources: (string | undefined)[]
): string {
  for (const source of sources) {
    if (source) {
      const contact = extractContactInfo(source);
      if (contact !== 'onbekend') {
        return contact;
      }
    }
  }
  return 'onbekend';
}

/**
 * Validate if a string is a phone number
 */
export function isValidPhone(text: string): boolean {
  const phoneRegex = /(\+31|0031|0)[\s]?[1-9][\s]?[0-9]{7,8}/;
  return phoneRegex.test(text);
}

/**
 * Validate if a string is an email
 */
export function isValidEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text);
}

/**
 * Normalize phone number to standard format
 */
export function normalizePhone(phone: string): string {
  let normalized = phone
    .replace(/[\s\-()]/g, '')
    .replace(/^0031/, '+31')
    .replace(/^0/, '+310');

  // Ensure +31 prefix
  if (!normalized.startsWith('+31')) {
    if (!normalized.startsWith('+')) {
      normalized = '+31' + normalized;
    }
  }

  return normalized;
}

export default {
  extractContactInfo,
  extractContactFromMultipleSources,
  isValidPhone,
  isValidEmail,
  normalizePhone,
};
