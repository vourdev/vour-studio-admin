import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { desc } from 'drizzle-orm'

import { db } from '@/db'
import { media } from '@/db/schema'
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

  // Render the library server-side so it paints instantly.
  const initialMedia = (await db
    .select()
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(60)) as any[]

  return (
    <div>
      <PageHeader
        title="Media"
        description="Library gambar untuk postingan, produk, dan projects."
      />
      <Card>
        <CardContent className="pt-6">
          <MediaLibrary
            canWrite={canWrite(user, 'media')}
            initialMedia={initialMedia}
          />
        </CardContent>
      </Card>
    </div>
  )
}
