import { createIdCrudHandlers } from '@/lib/crud'
import { posts } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(posts, 'posts')
