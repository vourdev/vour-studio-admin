import type { CollectionConfig } from 'payload'

import { canReadCollection, canWriteCollection } from '../access'

/**
 * Leads submitted through the public marketing site (vour-studio).
 *
 * Writes only happen through the public API route at `/api/leads`, never
 * through the REST collection endpoint — `create` is closed here so the admin
 * panel cannot be used to fabricate leads and unauthenticated POSTs to
 * `/api/leads` are rejected.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: {
    singular: 'Lead',
    plural: 'Leads',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'sourcePage', 'createdAt', 'status'],
    group: 'Inbox',
    description: 'Pesan masuk dari form kontak website.',
    listSearchableFields: ['name', 'email', 'message', 'whatsapp'],
  },
  access: {
    create: () => false,
    read: canReadCollection('leads'),
    update: canWriteCollection('leads'),
    delete: canWriteCollection('leads'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'whatsapp',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'sourcePage',
      type: 'text',
      defaultValue: '/contact',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Baru', value: 'new' },
        { label: 'Dihubungi', value: 'contacted' },
        { label: 'Selesai', value: 'closed' },
        { label: 'Tidak relevan', value: 'archived' },
      ],
      defaultValue: 'new',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
  defaultSort: '-createdAt',
}
