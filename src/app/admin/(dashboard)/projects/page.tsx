import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProjectsTable } from '@/components/admin/tables/projects-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Projects — Vour Studio Admin',
}

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'projects')) notFound()

  return (
    <div>
      <PageHeader title="Projects" description="Studi kasus portfolio." />
      <Card>
        <CardContent className="pt-6">
          <ProjectsTable canWrite={canWrite(user, 'projects')} />
        </CardContent>
      </Card>
    </div>
  )
}
