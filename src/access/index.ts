import type { Access } from 'payload'

import type { PermissionCollection } from '../lib/permissions'

/**
 * Shared access control helpers.
 *
 * Payload has no roles out of the box, so we add a `roles` field (admin /
 * editor) plus a per-collection `permissions` array on Users. Access always
 * fails closed: no user, no access.
 *
 * The `admin` role is a superuser and bypasses every permission check below.
 * Everyone else is gated by their `permissions` entries — a user without an
 * entry for a collection gets no access to it.
 */

export const anyone: Access = () => true

export const admins: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

// Boolean-only variant for operations that reject query constraints (e.g. the
// `admin` access that controls sidebar visibility).
export const isAdmin: ({ req }: { req: { user?: { roles?: string[] } | null } }) => boolean = ({
  req,
}) => Boolean(req.user?.roles?.includes('admin'))

/** True when the user may read a collection (admin bypasses everything). */
export const canReadCollection = (collection: PermissionCollection): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true
    return Boolean(user.permissions?.some((p) => p.collection === collection && p.canRead))
  }
}

/** True when the user may write (create/update/delete) a collection. */
export const canWriteCollection = (collection: PermissionCollection): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true
    return Boolean(user.permissions?.some((p) => p.collection === collection && p.canWrite))
  }
}
