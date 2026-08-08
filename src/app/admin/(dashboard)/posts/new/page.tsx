import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { PostForm } from '@/components/admin/post-form'

export const metadata: Metadata = {
  title: 'Postingan Baru — Vour Studio Admin',
}

export default async function NewPostPage() {
  const user = await getCurrentUser()
  const write = canWrite(user, 'posts')
  if (!write) notFound()

  return <PostForm canWrite={write} />
}
