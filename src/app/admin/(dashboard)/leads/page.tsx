import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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

  return (
    <div>
      <PageHeader title="Leads" description="Pesan masuk dari form kontak marketing site." />
      <Card>
        <CardContent className="pt-6">
          <LeadsTable />
        </CardContent>
      </Card>
    </div>
  )
}
