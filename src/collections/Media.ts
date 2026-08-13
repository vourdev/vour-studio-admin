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
        height: 432,
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
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc.url && typeof doc.url === 'string' && doc.url.includes('.r2.dev/')) {
          const parts = doc.url.split('.r2.dev/')
          doc.url = `/api/media/file/${parts[parts.length - 1]}`
        }
        if (doc.sizes && typeof doc.sizes === 'object') {
          for (const key of Object.keys(doc.sizes)) {
            const size = doc.sizes[key]
            if (size && size.url && typeof size.url === 'string' && size.url.includes('.r2.dev/')) {
              const parts = size.url.split('.r2.dev/')
              size.url = `/api/media/file/${parts[parts.length - 1]}`
            }
          }
        }
        return doc
      },
    ],
  },
}
