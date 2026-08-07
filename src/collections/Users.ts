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
