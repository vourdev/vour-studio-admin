import type { Access } from 'payload'

/**
 * Shared access control helpers.
 *
 * Payload has no roles out of the box, so we add a `roles` field on Users
 * (admin / editor) and gate every collection through these helpers. Access
 * always fails closed: no user, no access.
 */

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const admins: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

// Boolean-only variant for operations that reject query constraints (e.g. the
// `admin` access that controls sidebar visibility).
export const isAdmin: ({ req }: { req: { user?: { roles?: string[] } | null } }) => boolean = ({
  req,
}) => Boolean(req.user?.roles?.includes('admin'))

export const adminsOrEditors: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.some((role) => ['admin', 'editor'].includes(role)))
