import { createIdCrudHandlers } from '@/lib/crud'
import { newsletterSubscribers } from '@/db/schema'

export const { GET, PATCH, DELETE } = createIdCrudHandlers(newsletterSubscribers, 'newsletter-subscribers')
