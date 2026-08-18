import { createIdCrudHandlers } from '@/lib/crud'
import { media } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(media, 'media')
