import { createIdCrudHandlers } from '@/lib/crud'
import { products } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(products, 'products')
