import { cookies } from 'next/headers'
import { cache } from 'react'
import { eq } from 'drizzle-orm'

import type { User } from '@/payload-types'
import { db } from '@/db'
import { users, usersRoles, usersPermissions } from '@/db/schema'
import { verifyJWT } from './auth-jwt'

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value
    if (!token) return null

    const decrypted = await verifyJWT(token)
    if (!decrypted || !decrypted.id) return null

    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, decrypted.id))
      .limit(1)

    if (!userRecord) return null

    const rolesRecords = await db
      .select()
      .from(usersRoles)
      .where(eq(usersRoles.parentId, userRecord.id))

    const permissionsRecords = await db
      .select()
      .from(usersPermissions)
      .where(eq(usersPermissions.parentId, userRecord.id))

    return {
      id: userRecord.id,
      collection: 'users',
      email: userRecord.email,
      name: userRecord.name,
      roles: rolesRecords.map((r) => r.value as 'admin' | 'editor'),
      permissions: permissionsRecords.map((p) => ({
        collection: p.collection as any,
        canRead: p.canRead ?? true,
        canWrite: p.canWrite ?? false,
      })),
      createdAt: userRecord.createdAt.toISOString(),
      updatedAt: userRecord.updatedAt.toISOString(),
    }
  } catch (error) {
    return null
  }
})
