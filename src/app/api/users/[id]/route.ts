import { createIdCrudHandlers } from '@/lib/crud'
import { users } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(users, 'users')
