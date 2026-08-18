import 'dotenv/config'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { db } from '../src/db'
import { users, usersRoles } from '../src/db/schema'

/**
 * One-off script: create the first admin user.
 * Usage: npm run create:admin -- <email> <password>
 */
async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npm run create:admin -- <email> <password>')
    process.exit(1)
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (existing) {
    console.log(`User ${email} sudah ada (id=${existing.id}). Melewatkan.`)
    process.exit(0)
  }

  const hash = bcrypt.hashSync(password, 10)

  const [inserted] = await db
    .insert(users)
    .values({
      email: email.toLowerCase().trim(),
      hash,
      name: 'Vour Admin',
    })
    .returning()

  if (inserted) {
    await db.insert(usersRoles).values({
      order: 1,
      parentId: inserted.id,
      value: 'admin',
    })
  }

  console.log(`Admin user dibuat: ${email}`)
  process.exit(0)
}

createAdmin().catch((error) => {
  console.error(error)
  process.exit(1)
})
