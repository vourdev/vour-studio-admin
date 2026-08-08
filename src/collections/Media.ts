import type { CollectionConfig } from 'payload'

import { anyone, canWriteCollection } from '../access'

/**
 * Uploaded images used across posts, products and projects. Image sizes match
 * the aspect ratios the marketing site renders today.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: canWriteCollection('media'),
    update: canWriteCollection('media'),
    delete: canWriteCollection('media'),
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'card',
        width: 768,
        height: 576,
        position: 'centre',
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
