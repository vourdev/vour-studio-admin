/**
 * Converts a human-readable name/title into a URL-safe slug, e.g.
 * "Developer Starter Kit" -> "developer-starter-kit". Auto-filled slug fields
 * use this so new docs get stable, readable URLs without manual input.
 */
export const formatSlug = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
