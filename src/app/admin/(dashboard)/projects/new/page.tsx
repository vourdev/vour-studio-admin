import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProjectForm } from '@/components/admin/project-form'

export const metadata: Metadata = {
  title: 'Project Baru — Vour Studio Admin',
}

export default async function NewProjectPage() {
  const user = await getCurrentUser()
  const write = canWrite(user, 'projects')
  if (!write) notFound()

  return <ProjectForm canWrite={write} />
}
