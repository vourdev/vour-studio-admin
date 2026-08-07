import type { CollectionConfig } from 'payload'

import { admins, adminsOrEditors } from '../access'

/**
 * Portfolio case studies. Field names mirror the `Project` type in the
 * marketing site (`lib/data/projects.ts`).
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'industry', 'year', 'updatedAt'],
    group: 'Content',
    description: 'Studi kasus project.',
    listSearchableFields: ['name', 'industry', 'challenge', 'solution'],
  },
  access: {
    create: adminsOrEditors,
    read: () => true,
    update: adminsOrEditors,
    delete: admins,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'industry',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'year',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'result',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Headline hasil yang didapat klien.',
      },
    },
    {
      name: 'challenge',
      type: 'textarea',
      required: true,
    },
    {
      name: 'solution',
      type: 'textarea',
      required: true,
    },
    {
      name: 'technology',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      fields: [{ name: 'tech', type: 'text', required: true }],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Thumbnail project (1200×800 direkomendasikan).',
      },
    },
  ],
  defaultSort: '-year',
}
