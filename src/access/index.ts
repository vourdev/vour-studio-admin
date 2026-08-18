import type { PermissionCollection } from '../lib/permissions'

/**
 * Shared access control helpers.
 *
 * We check if the user is authenticated.
 * The `admin` role is a superuser and bypasses every permission check below.
 * Everyone else is gated by their `permissions` entries — a user without an
 * entry for a collection gets no access to it.
 */

export const anyone = () => true

export const admins = ({ req: { user } }: { req: { user?: any } }) =>
  Boolean(user?.roles?.includes('admin'))

// Boolean-only variant for operations that reject query constraints
export const isAdmin: ({ req }: { req: { user?: { roles?: string[] } | null } }) => boolean = ({
  req,
}) => Boolean(req.user?.roles?.includes('admin'))

/** True when the user may read a collection. */
export const canReadCollection = (collection: PermissionCollection) => {
  return ({ req: { user } }: { req: { user?: any } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true
    return Boolean(user.permissions?.some((p: any) => p.collection === collection && p.canRead))
  }
}

/** True when the user may write (create/update/delete) a collection. */
export const canWriteCollection = (collection: PermissionCollection) => {
  return ({ req: { user } }: { req: { user?: any } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true
    return Boolean(user.permissions?.some((p: any) => p.collection === collection && p.canWrite))
  }
}
