import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { PostsTable } from '@/components/admin/tables/posts-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Postingan — Vour Studio Admin',
}

export default async function PostsPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'posts')) notFound()

  return (
    <div>
      <PageHeader title="Postingan" description="Artikel blog — draft & published." />
      <Card>
        <CardContent className="pt-6">
          <PostsTable canWrite={canWrite(user, 'posts')} />
        </CardContent>
      </Card>
    </div>
  )
}
