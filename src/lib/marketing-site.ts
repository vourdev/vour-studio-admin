/**
 * Helpers for building links to the marketing site (vour-studio).
 *
 * The marketing site serves posts at `/resources/{slug}` (mirrors the MDX
 * files it used to ship under `content/resources/`). The base URL comes from
 * `MARKETING_SITE_URL`, falling back to `REVALIDATE_URL` (the webhook target)
 * so preview links work without extra configuration.
 */

export function getMarketingSiteUrl(): string | null {
  const url = process.env.MARKETING_SITE_URL || process.env.REVALIDATE_URL
  return url ? url.replace(/\/+$/, '') : null
}

/** Absolute URL of a post on the marketing site, or null if no site is configured. */
export function getPostPreviewUrl(slug: string): string | null {
  const base = getMarketingSiteUrl()
  if (!base) return null
  return `${base}/resources/${slug}`
}
