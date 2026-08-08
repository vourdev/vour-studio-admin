import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { SiteSettingsForm } from '@/components/admin/site-settings-form'
import { PageHeader } from '@/components/admin/page-header'

export const metadata: Metadata = {
  title: 'Pengaturan Situs — Vour Studio Admin',
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'site-settings')) notFound()

  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const canWriteSettings = canWrite(user, 'site-settings')

  return (
    <div>
      <PageHeader
        title="Pengaturan Situs"
        description="Kontak, media sosial, dan menu navigasi marketing site."
      />
      <SiteSettingsForm settings={settings} canWrite={canWriteSettings} />
    </div>
  )
}
