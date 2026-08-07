import type { CollectionConfig } from 'payload'

import { admins, adminsOrEditors } from '../access'
import { formatSlug } from '../lib/format-slug'
import { revalidateSite } from '../hooks/revalidate-site'

/**
 * Blog posts. The marketing site currently ships MDX files under
 * `content/resources/`; this collection is the database-backed replacement so
 * posts can be written and published from the admin panel.
 *
 * Field names mirror the existing `PostMeta` type in the marketing site
 * (`lib/content.ts`) so the site can consume the API without reshaping.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Postingan',
    plural: 'Postingan',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'date', 'updatedAt'],
    group: 'Content',
    description: 'Artikel blog.',
    listSearchableFields: ['title', 'description', 'slug'],
  },
  access: {
    create: adminsOrEditors,
    read: ({ req: { user } }) => {
      // Public sees published posts only; logged-in admins see everything.
      if (user) return true
      return { _status: { equals: 'published' } }
    },
    update: adminsOrEditors,
    delete: admins,
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) =>
            value ? value : formatSlug(siblingData.title),
        ],
      },
      admin: {
        position: 'sidebar',
        description: 'Bagian URL artikel. Kosongkan untuk mengisi otomatis dari judul.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['Tutorial', 'Case Study', 'Dev Notes'],
      defaultValue: 'Dev Notes',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'readingMinutes',
      type: 'number',
      required: true,
      min: 1,
      max: 60,
      defaultValue: 5,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Cover artikel (1200×675 direkomendasikan).',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'related',
      type: 'array',
      maxRows: 5,
      admin: {
        description: 'Tautan internal ke layanan atau produk terkait.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSite],
  },
  defaultSort: '-date',
}
