import { describe, it, expect } from 'vitest'

import { db } from '@/db'
import { users } from '@/db/schema'

describe('API', () => {
  it('fetches users', async () => {
    const list = await db.select().from(users)
    expect(list).toBeDefined()
  })
})
