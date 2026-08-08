import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * Returns the authenticated user for dashboard server components (or null when
 * not logged in). The dashboard layout already redirects anonymous visitors to
 * /admin/login, so pages can rely on this returning the logged-in user.
 */
export async function getCurrentUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return user
}
