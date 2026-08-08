import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/lib/get-current-user'
import { UsersTable } from '@/components/admin/tables/users-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Users — Vour Studio Admin',
}

export default async function UsersPage() {
  // Only admins manage users — mirrors Users.access.read = admins.
  const user = await getCurrentUser()
  if (!user?.roles?.includes('admin')) notFound()

  const payload = await getPayload({ config })
  const initial = await payload.find({
    collection: 'users',
    limit: 10,
    sort: 'email',
    depth: 0,
  })

  return (
    <div>
      <PageHeader title="Users" description="Kelola akses admin panel." />
      <Card>
        <CardContent className="pt-6">
          <UsersTable initialData={initial.docs} initialRowCount={initial.totalDocs} />
        </CardContent>
      </Card>
    </div>
  )
}
