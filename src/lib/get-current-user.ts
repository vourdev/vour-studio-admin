import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { cache } from 'react'

/**
 * Returns the authenticated user for dashboard server components (or null when
 * not logged in). The dashboard layout already redirects anonymous visitors to
 * /admin/login, so pages can rely on this returning the logged-in user.
 *
 * Wrapped in React `cache()` so layout + page (and any nested server
 * components) share a single `payload.auth()` DB lookup per request instead of
 * each calling it again. The Payload instance itself is already cached
 * globally by `getPayload` — this dedupes the auth DB round-trip.
 */
export const getCurrentUser = cache(async () => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return user
})
