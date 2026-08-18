import { createCrudHandlers } from '@/lib/crud'
import { projects } from '@/db/schema'

export const { GET, POST, DELETE } = createCrudHandlers(projects, 'projects')
