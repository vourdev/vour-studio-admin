import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { LeadsTable } from '@/components/admin/tables/leads-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Leads — Vour Studio Admin',
}

export default async function LeadsPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'leads')) notFound()

  const payload = await getPayload({ config })
  const initial = await payload.find({
    collection: 'leads',
    limit: 10,
    sort: '-createdAt',
    depth: 0,
  })

  return (
    <div>
      <PageHeader title="Leads" description="Pesan masuk dari form kontak marketing site." />
      <Card>
        <CardContent className="pt-6">
          <LeadsTable initialData={initial.docs} initialRowCount={initial.totalDocs} />
        </CardContent>
      </Card>
    </div>
  )
}
