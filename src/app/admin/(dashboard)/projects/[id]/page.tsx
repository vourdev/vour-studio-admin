import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProjectForm } from '@/components/admin/project-form'

export const metadata: Metadata = {
  title: 'Edit Project — Vour Studio Admin',
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'projects')) notFound()

  const payload = await getPayload({ config })
  const project = await payload.findByID({ collection: 'projects', id }).catch(() => null)
  if (!project) notFound()

  return <ProjectForm project={project} canWrite={canWrite(user, 'projects')} />
}
