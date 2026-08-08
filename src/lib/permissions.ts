import type { User } from '@/payload-types'

/**
 * Per-user, per-collection RBAC.
 *
 * Every manageable collection/global can be gated independently with a simple
 * read / write pair. The `admin` role always bypasses the checks (superuser).
 * Users without a matching permission entry (or an empty list) get no access —
 * access control fails closed.
 */

/** Collections and globals that can be gated by per-user permissions. */
export const PERMISSIONABLE_COLLECTIONS = [
  { slug: 'posts', label: 'Postingan' },
  { slug: 'products', label: 'Produk' },
  { slug: 'projects', label: 'Projects' },
  { slug: 'media', label: 'Media' },
  { slug: 'leads', label: 'Leads' },
  { slug: 'newsletter-subscribers', label: 'Subscribers' },
  { slug: 'site-settings', label: 'Pengaturan Situs' },
] as const

export type PermissionCollection = (typeof PERMISSIONABLE_COLLECTIONS)[number]['slug']

export interface CollectionPermission {
  collection: PermissionCollection
  canRead: boolean
  canWrite: boolean
}

type MaybeUser = Pick<User, 'roles' | 'permissions'> | null | undefined

export const isAdmin = (user: MaybeUser): boolean => Boolean(user?.roles?.includes('admin'))

export const canRead = (user: MaybeUser, collection: PermissionCollection): boolean => {
  if (!user) return false
  if (isAdmin(user)) return true
  return Boolean(user.permissions?.some((p) => p.collection === collection && p.canRead))
}

export const canWrite = (user: MaybeUser, collection: PermissionCollection): boolean => {
  if (!user) return false
  if (isAdmin(user)) return true
  return Boolean(user.permissions?.some((p) => p.collection === collection && p.canWrite))
}
