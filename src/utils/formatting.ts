/**
 * @file Formatting utilities
 */

/**
 * Formats a date to a readable string
 * @param date - Date to format
 * @returns Formatted date
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';

  const dateObject = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObject.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObject);
}

/**
 * Formats a date to a relative time string (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const dateObject = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObject.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObject.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

  return formatDate(dateObject);
}

/**
 * Formats file size to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || bytes < 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Formats a number with thousand separators
 * @param num - Number to format
 * @returns Formatted number
 */
export function formatNumber(num: number): string {
  if (typeof num !== 'number') {
    return '0';
  }

  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Converts text to title case
 * @param text - Text to convert
 * @returns Title cased text
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a percentage
 * @param value - Value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  if (typeof value !== 'number') {
    return '0%';
  }

  const clamped = Math.max(0, Math.min(100, value));
  return `${clamped.toFixed(decimals)}%`;
}

/**
 * Formats a duration in milliseconds to human-readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration
 */
export function formatDuration(ms: number): string {
  if (typeof ms !== 'number' || ms < 0) {
    return '0s';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Capitalizes the first letter of a string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Pluralizes a word based on count
 * @param count - Count to check
 * @param singular - Singular form
 * @param plural - Plural form (defaults to singular + 's')
 * @returns Pluralized word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}

/**
 * Formats a list of items with proper grammar
 * @param items - Items to format
 * @param conjunction - Conjunction to use (default: 'and')
 * @returns Formatted list
 */
export function formatList(items: string[], conjunction: string = 'and'): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} ${conjunction} ${items[1]}`;
  }

  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, ${conjunction} ${last}`;
}
