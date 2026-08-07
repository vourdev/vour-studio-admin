import type { CollectionConfig } from 'payload'

import { admins, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200, // 2 hours
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
  },
  access: {
    // Editors never see the Users collection in the admin nav.
    admin: isAdmin,
    create: admins,
    read: admins,
    update: ({ req: { user }, id }) => {
      // Admins can update anyone; editors can only update themselves.
      if (user?.roles?.includes('admin')) return true
      return user?.id === id
    },
    delete: admins,
  },
  fields: [
    {
      // Overrides Payload's auto-generated auth password field so the admin
      // renders a show/hide toggle (eye icon) instead of the default input.
      //
      // virtual: Payload auth stores passwords as salt+hash — there is NO
      // `password` column in the DB. Without virtual the field is persisted,
      // so every users query SELECTs users.password and fails (column does
      // not exist) — that broke production login in Aug 2026. The typed value
      // still flows through data.password into the auth hashing logic.
      // admin.readOnly: false is required because Payload defaults virtual
      // fields to read-only.
      name: 'password',
      type: 'text',
      virtual: true,
      admin: {
        components: {
          Field: '/components/fields/PasswordInput#PasswordInput',
        },
        readOnly: false,
        description:
          'Kata sandi pengguna. Kosongkan saat edit untuk mempertahankan sandi lama.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      options: ['admin', 'editor'],
      defaultValue: ['editor'],
      saveToJWT: true,
      access: {
        // Only admins can change roles.
        update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      },
      admin: {
        description: 'Editor mengelola konten; admin mengelola konten dan pengguna.',
      },
    },
  ],
}
