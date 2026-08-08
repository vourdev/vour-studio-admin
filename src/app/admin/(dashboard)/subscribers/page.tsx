import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { SubscribersTable } from '@/components/admin/tables/subscribers-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Subscribers — Vour Studio Admin',
}

export default async function SubscribersPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'newsletter-subscribers')) notFound()

  return (
    <div>
      <PageHeader title="Subscribers" description="Pendaftar newsletter." />
      <Card>
        <CardContent className="pt-6">
          <SubscribersTable canWrite={canWrite(user, 'newsletter-subscribers')} />
        </CardContent>
      </Card>
    </div>
  )
}
