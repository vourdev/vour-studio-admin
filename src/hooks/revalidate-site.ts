import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

/**
 * Fires the marketing site's revalidate webhook after CMS content changes, so
 * published products/projects/posts/site-settings go live immediately instead
 * of waiting for the 60s ISR window. Degrades gracefully: if REVALIDATE_URL /
 * REVALIDATE_SECRET are unset it silently does nothing.
 */
const notifyMarketingSite = async () => {
  const url = process.env.REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return
  try {
    await fetch(`${url.replace(/\/+$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
    })
  } catch (error) {
    console.warn('[revalidate] Marketing site tidak dapat diberi tahu.', error)
  }
}

/** afterChange hook for collections (products, projects, posts). Skips draft saves. */
export const revalidateSite: CollectionAfterChangeHook = async ({ doc }) => {
  // Draft saves change nothing the public site serves; publishing is an update
  // with _status 'published' and passes this check.
  if (doc && (doc as { _status?: string })._status === 'draft') return
  await notifyMarketingSite()
}

/** afterChange hook for globals (site-settings). */
export const revalidateSiteGlobal: GlobalAfterChangeHook = async () => {
  await notifyMarketingSite()
}
