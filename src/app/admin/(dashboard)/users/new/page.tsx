import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/get-current-user'
import { UserForm } from '@/components/admin/user-form'

export const metadata: Metadata = {
  title: 'Pengguna Baru — Vour Studio Admin',
}

export default async function NewUserPage() {
  const user = await getCurrentUser()
  if (!user?.roles?.includes('admin')) notFound()

  return <UserForm />
}
