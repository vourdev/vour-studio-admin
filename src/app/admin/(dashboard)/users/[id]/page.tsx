import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/get-current-user'
import { UserForm } from '@/components/admin/user-form'
import { fetchFullDoc } from '@/lib/crud'
import { users } from '@/db/schema'

export const metadata: Metadata = {
  title: 'Edit Pengguna — Vour Studio Admin',
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user?.roles?.includes('admin')) notFound()

  const target = (await fetchFullDoc('users', users, isNaN(Number(id)) ? id : Number(id))) as any
  if (!target) notFound()

  return <UserForm user={target} />
}
