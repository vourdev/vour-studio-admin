import { createCrudHandlers } from '@/lib/crud'
import { users } from '@/db/schema'

export const { GET, POST, DELETE } = createCrudHandlers(users, 'users')
