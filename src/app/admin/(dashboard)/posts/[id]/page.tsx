import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { PostForm } from '@/components/admin/post-form'
import { getPostPreviewUrl } from '@/lib/marketing-site'
import { fetchFullDoc } from '@/lib/crud'
import { posts } from '@/db/schema'

export const metadata: Metadata = {
  title: 'Edit Postingan — Vour Studio Admin',
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'posts')) notFound()

  const post = (await fetchFullDoc('posts', posts, isNaN(Number(id)) ? id : Number(id))) as any
  if (!post) notFound()

  return <PostForm post={post} previewUrl={getPostPreviewUrl(post.slug)} canWrite={canWrite(user, 'posts')} />
}
