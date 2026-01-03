/*----------------------- Slug Helpers -----------------------*/
/**
 * Convert a title to a URL-safe slug for storage
 * e.g., "Summer 2026 Photos" -> "summer-2026-photos"
 */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Convert a slug back to a pretty title for display
 * e.g., "summer-2026-photos" -> "Summer 2026 Photos"
 */
export function fromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
