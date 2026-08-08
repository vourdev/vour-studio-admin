import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { PostForm } from '@/components/admin/post-form'
import { getPostPreviewUrl } from '@/lib/marketing-site'

export const metadata: Metadata = {
  title: 'Edit Postingan — Vour Studio Admin',
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'posts')) notFound()

  const payload = await getPayload({ config })
  const post = await payload.findByID({ collection: 'posts', id, draft: true }).catch(() => null)
  if (!post) notFound()

  return <PostForm post={post} previewUrl={getPostPreviewUrl(post.slug)} canWrite={canWrite(user, 'posts')} />
}
