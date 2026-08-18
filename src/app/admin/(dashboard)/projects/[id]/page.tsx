import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProjectForm } from '@/components/admin/project-form'
import { fetchFullDoc } from '@/lib/crud'
import { projects } from '@/db/schema'

export const metadata: Metadata = {
  title: 'Edit Project — Vour Studio Admin',
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'projects')) notFound()

  const project = (await fetchFullDoc('projects', projects, isNaN(Number(id)) ? id : Number(id))) as any
  if (!project) notFound()

  return <ProjectForm project={project} canWrite={canWrite(user, 'projects')} />
}
