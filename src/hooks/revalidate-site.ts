/**
 * Fires the marketing site's revalidate webhook after CMS content changes, so
 * published products/projects/posts/site-settings go live immediately.
 */
export const revalidateSite = async () => {
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
