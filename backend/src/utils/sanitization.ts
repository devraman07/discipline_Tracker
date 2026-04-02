// Input sanitization utility

/**
 * Sanitizes user input by:
 * - Removing HTML tags
 * - Trimming whitespace
 * - Limiting length
 * - Removing control characters
 */
export function sanitizeInput(input: string, maxLength = 2000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validates that input contains no HTML/script tags
 */
export function containsHtml(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return /<[^>]*>/g.test(input);
}

/**
 * Sanitizes reflection field specifically
 */
export function sanitizeReflection(reflection: string): string {
  return sanitizeInput(reflection, 2000);
}
