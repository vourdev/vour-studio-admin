import { createIdCrudHandlers } from '@/lib/crud'
import { leads } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(leads, 'leads')
