import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/lib/get-current-user'
import { UsersTable } from '@/components/admin/tables/users-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Users — Vour Studio Admin',
}

export default async function UsersPage() {
  const user = await getCurrentUser()
  const isAdmin = user?.roles?.includes('admin')
  if (!isAdmin) notFound()

  return (
    <div>
      <PageHeader title="Users" description="Kelola akses admin panel." />
      <Card>
        <CardContent className="pt-6">
          <UsersTable canWrite={isAdmin} />
        </CardContent>
      </Card>
    </div>
  )
}
