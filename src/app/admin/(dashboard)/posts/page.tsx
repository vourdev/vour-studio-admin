import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

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

  // Render the first page server-side (Local API, already-cached Payload
  // instance) so the table paints instantly; the client then refreshes in the
  // background and takes over search / sort / pagination.
  const payload = await getPayload({ config })
  const initial = await payload.find({
    collection: 'posts',
    limit: 10,
    sort: '-date',
    draft: true,
    depth: 0,
  })

  return (
    <div>
      <PageHeader title="Postingan" description="Artikel blog — draft & published." />
      <Card>
        <CardContent className="pt-6">
          <PostsTable
            canWrite={canWrite(user, 'posts')}
            initialData={initial.docs}
            initialRowCount={initial.totalDocs}
          />
        </CardContent>
      </Card>
    </div>
  )
}
