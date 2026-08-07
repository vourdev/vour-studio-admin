import type { CollectionConfig } from 'payload'

import { admins, adminsOrEditors } from '../access'

/**
 * Digital products (templates, starter kits, toolkits). Field names mirror the
 * `Product` type in the marketing site (`lib/data/products.ts`).
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produk',
    plural: 'Produk',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status', 'price', 'updatedAt'],
    group: 'Content',
    description: 'Produk digital: template, starter kit, toolkit.',
    listSearchableFields: ['name', 'tagline', 'slug'],
  },
  access: {
    create: adminsOrEditors,
    // All products are public: the marketing site renders `soon` items with a
    // disabled CTA, so filtering by status here would empty /products.
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
      name: 'category',
      type: 'select',
      required: true,
      options: ['Template', 'Starter Kit', 'Toolkit'],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tagline',
      type: 'textarea',
      required: true,
    },
    {
      name: 'features',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      fields: [{ name: 'feature', type: 'text', required: true }],
    },
    {
      name: 'price',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Harga dalam Rupiah. Kosongkan bila belum ditentukan.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: ['available', 'soon'],
      defaultValue: 'soon',
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
        description: 'Gambar produk (800×600 direkomendasikan).',
      },
    },
  ],
  defaultSort: '-updatedAt',
}
