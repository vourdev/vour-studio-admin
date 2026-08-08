import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { MediaLibrary } from '@/components/admin/media-library'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Media — Vour Studio Admin',
}

export default async function MediaPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'media')) notFound()

  return (
    <div>
      <PageHeader
        title="Media"
        description="Library gambar untuk postingan, produk, dan projects."
      />
      <Card>
        <CardContent className="pt-6">
          <MediaLibrary canWrite={canWrite(user, 'media')} />
        </CardContent>
      </Card>
    </div>
  )
}
