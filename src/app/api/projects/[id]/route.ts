import { createIdCrudHandlers } from '@/lib/crud'
import { projects } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(projects, 'projects')
