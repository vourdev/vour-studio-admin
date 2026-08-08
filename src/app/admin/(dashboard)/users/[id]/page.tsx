import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { UserForm } from '@/components/admin/user-form'

export const metadata: Metadata = {
  title: 'Edit Pengguna — Vour Studio Admin',
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user?.roles?.includes('admin')) notFound()

  const target = await payload.findByID({ collection: 'users', id }).catch(() => null)
  if (!target) notFound()

  return <UserForm user={target} />
}
