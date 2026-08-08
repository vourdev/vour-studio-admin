import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/lib/get-current-user'
import { UserForm } from '@/components/admin/user-form'

export const metadata: Metadata = {
  title: 'Edit Pengguna — Vour Studio Admin',
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user?.roles?.includes('admin')) notFound()

  const payload = await getPayload({ config })
  const target = await payload.findByID({ collection: 'users', id }).catch(() => null)
  if (!target) notFound()

  return <UserForm user={target} />
}
