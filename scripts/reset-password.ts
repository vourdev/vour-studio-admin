import 'dotenv/config'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { db } from '../src/db'
import { users } from '../src/db/schema'

/**
 * Set a new password on an existing account.
 *
 * create-admin.ts deliberately skips users that already exist, so this is the
 * way out when an account is locked - most likely one still holding a Payload
 * PBKDF2 hash that the bcrypt login path cannot read.
 *
 * Usage: npm run reset:password -- <email> <new-password>
 */
async function resetPassword() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npm run reset:password -- <email> <new-password>')
    process.exit(1)
  }

  const normalisedEmail = email.toLowerCase().trim()

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalisedEmail))
    .limit(1)

  if (!existing) {
    console.error(`User ${normalisedEmail} tidak ditemukan.`)
    process.exit(1)
  }

  // Clearing salt drops the account off the legacy verification path for good.
  await db
    .update(users)
    .set({ hash: bcrypt.hashSync(password, 10), salt: null })
    .where(eq(users.id, existing.id))

  console.log(`Password diperbarui untuk ${normalisedEmail} (id=${existing.id}).`)
  process.exit(0)
}

resetPassword().catch((error) => {
  console.error(error)
  process.exit(1)
})
