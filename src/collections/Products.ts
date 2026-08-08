import type { CollectionConfig } from 'payload'

import { canWriteCollection } from '../access'
import { formatSlug } from '../lib/format-slug'
import { revalidateSite } from '../hooks/revalidate-site'

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
    create: canWriteCollection('products'),
    // All products are public: the marketing site renders `soon` items with a
    // disabled CTA, so filtering by status here would empty /products.
    read: () => true,
    update: canWriteCollection('products'),
    delete: canWriteCollection('products'),
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) =>
            value ? value : formatSlug(siblingData.name),
        ],
      },
      admin: {
        position: 'sidebar',
        description: 'Bagian URL. Kosongkan untuk mengisi otomatis dari name.',
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
        description: 'Harga dalam Rupiah, contoh: Rp 12.000. Kosongkan bila belum ditentukan.',
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
  hooks: {
    afterChange: [revalidateSite],
  },
  defaultSort: '-updatedAt',
}
