import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { UserForm } from '@/components/admin/user-form'

export const metadata: Metadata = {
  title: 'Pengguna Baru — Vour Studio Admin',
}

export default async function NewUserPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user?.roles?.includes('admin')) notFound()

  return <UserForm />
}
