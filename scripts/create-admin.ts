import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

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

  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
  })

  if (existing.docs.length > 0) {
    console.log(`User ${email} sudah ada (id=${existing.docs[0].id}). Melewatkan.`)
    process.exit(0)
  }

  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name: 'Vour Admin',
      roles: ['admin'],
    },
  })

  console.log(`Admin user dibuat: ${email}`)
  process.exit(0)
}

createAdmin().catch((error) => {
  console.error(error)
  process.exit(1)
})
