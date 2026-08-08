import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { User } from '../src/payload-types'

type LimitedUserData = {
  email: string
  password: string
  name: string
  roles: User['roles']
  permissions: NonNullable<User['permissions']>
}

async function main() {
  const payload = await getPayload({ config })

  const email = 'limited@payloadcms.com'
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  const data: LimitedUserData = {
    email,
    password: 'test',
    name: 'Limited Editor',
    roles: ['editor'],
    permissions: [
      { collection: 'posts', canRead: true, canWrite: false },
      { collection: 'leads', canRead: true, canWrite: true },
    ],
  }

  if (existing.docs.length > 0) {
    const id = existing.docs[0].id
    const updated = await payload.update({
      collection: 'users',
      id,
      data,
    })
    console.log('updated limited user id:', updated.id)
  } else {
    const created = await payload.create({
      collection: 'users',
      data,
    })
    console.log('created limited user id:', created.id)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
