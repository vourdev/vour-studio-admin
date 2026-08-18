import { createCrudHandlers } from '@/lib/crud'
import { newsletterSubscribers } from '@/db/schema'

export const { GET, POST, DELETE } = createCrudHandlers(newsletterSubscribers, 'newsletter-subscribers')
