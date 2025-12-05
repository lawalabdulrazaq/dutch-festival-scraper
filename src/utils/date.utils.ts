/**
 * Date utility functions for parsing various date formats
 */

/**
 * Month name to number mapping
 */
const MONTHS: Record<string, string> = {
  jan: '01', january: '01', januari: '01',
  feb: '02', february: '02', februari: '02',
  mar: '03', march: '03', maart: '03',
  apr: '04', april: '04',
  may: '05', mei: '05',
  jun: '06', june: '06', juni: '06',
  jul: '07', july: '07', juli: '07',
  aug: '08', august: '08', augustus: '08',
  sep: '09', september: '09',
  oct: '10', october: '10', oktober: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Convert "21 nov" format to "YYYY-MM-DD"
 */
export function parseShortDate(dateStr: string): string {
  const parts = dateStr.trim().toLowerCase().split(/\s+/);
  
  if (parts.length < 2) {
    return '';
  }

  const day = parts[0].padStart(2, '0');
  const monthStr = parts[1];
  const month = MONTHS[monthStr];

  if (!month) {
    return '';
  }

  // Determine year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const eventMonth = parseInt(month);

  // If event month is before current month, assume next year
  const year = eventMonth < currentMonth ? currentYear + 1 : currentYear;

  return `${year}-${month}-${day}`;
}

/**
 * Convert "2025-12-03" to "03 dec 2025" (Dutch format)
 */
export function formatDateDutch(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 
                      'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const monthName = monthNames[parseInt(month) - 1];
  
  return `${parseInt(day)} ${monthName} ${year}`;
}

/**
 * Parse various date formats to YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }

  // Try DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }

  // Try "21 nov" format
  return parseShortDate(dateStr);
}

/**
 * Calculate duration between two dates
 */
export function calculateDuration(startDate: string, endDate?: string): string {
  if (!endDate) {
    return '1 dag';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Enkele uren';
  if (diffDays === 1) return '1 dag';
  return `${diffDays} dagen`;
}

/**
 * Check if date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return date >= now;
}