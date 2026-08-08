import type { CollectionConfig } from 'payload'

import { canReadCollection, canWriteCollection } from '../access'

/**
 * Newsletter subscribers. The marketing site currently has no newsletter form
 * wired up, but the collection exists so the data model is ready when it does.
 * Like leads, writes come through an API route rather than the REST endpoint.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: {
    singular: 'Subscriber',
    plural: 'Subscribers',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'createdAt'],
    group: 'Inbox',
    description: 'Pendaftar newsletter.',
    listSearchableFields: ['email'],
  },
  access: {
    create: () => false,
    read: canReadCollection('newsletter-subscribers'),
    update: canWriteCollection('newsletter-subscribers'),
    delete: canWriteCollection('newsletter-subscribers'),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
  ],
  timestamps: true,
  defaultSort: '-createdAt',
}
