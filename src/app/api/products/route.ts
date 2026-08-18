import { createCrudHandlers } from '@/lib/crud'
import { products } from '@/db/schema'

export const { GET, POST, DELETE } = createCrudHandlers(products, 'products')
