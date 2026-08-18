import { createCrudHandlers } from '@/lib/crud'
import { posts } from '@/db/schema'

export const { GET, POST, DELETE } = createCrudHandlers(posts, 'posts')
