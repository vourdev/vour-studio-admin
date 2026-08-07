import type { GlobalConfig } from 'payload'

import { adminsOrEditors } from '../access'

/**
 * Site-wide settings for the marketing site: contact details, social links and
 * the main navigation. Read anonymously via GET /api/globals/site-settings;
 * the marketing site falls back to lib/site.ts defaults when unreachable.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Pengaturan Situs',
  admin: {
    group: 'Settings',
    description: 'Kontak, media sosial, dan menu navigasi marketing site.',
  },
  access: {
    read: () => true,
    update: adminsOrEditors,
  },
  fields: [
    {
      type: 'group',
      name: 'contact',
      label: 'Kontak',
      fields: [
        {
          name: 'whatsappNumber',
          type: 'text',
          label: 'Nomor WhatsApp (internasional, tanpa +)',
          defaultValue: '6287787388296',
        },
        {
          name: 'phoneNumber',
          type: 'text',
          label: 'Nomor telepon (tampilan)',
          defaultValue: '087787388296',
        },
        {
          name: 'contactEmail',
          type: 'email',
          label: 'Email kontak',
          defaultValue: 'vour.d3v@gmail.com',
        },
      ],
    },
    {
      type: 'array',
      name: 'socials',
      label: 'Media sosial',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: ['github', 'linkedin', 'instagram', 'tiktok'],
          defaultValue: 'github',
        },
      ],
    },
    {
      type: 'array',
      name: 'mainNav',
      label: 'Menu navigasi',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
