import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { UsersTable } from '@/components/admin/tables/users-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Users — Vour Studio Admin',
}

export default async function UsersPage() {
  // Only admins manage users — mirrors Users.access.read = admins.
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user?.roles?.includes('admin')) notFound()

  return (
    <div>
      <PageHeader title="Users" description="Kelola akses admin panel." />
      <Card>
        <CardContent className="pt-6">
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  )
}
