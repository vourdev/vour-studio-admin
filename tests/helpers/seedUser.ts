import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { db } from '../../src/db'
import { users, usersRoles } from '../../src/db/schema'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  name: 'Test User',
  roles: ['admin'],
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const hash = bcrypt.hashSync(testUser.password, 10)

  // Delete existing test user if any
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, testUser.email))
    .limit(1)

  if (existing) {
    await db.delete(usersRoles).where(eq(usersRoles.parentId, existing.id))
    await db.delete(users).where(eq(users.id, existing.id))
  }

  // Create fresh test user
  const [inserted] = await db
    .insert(users)
    .values({
      email: testUser.email,
      hash,
      name: testUser.name,
    })
    .returning()

  if (inserted) {
    await db.insert(usersRoles).values({
      order: 1,
      parentId: inserted.id,
      value: 'admin',
    })
  }
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, testUser.email))
    .limit(1)

  if (existing) {
    await db.delete(usersRoles).where(eq(usersRoles.parentId, existing.id))
    await db.delete(users).where(eq(users.id, existing.id))
  }
}
