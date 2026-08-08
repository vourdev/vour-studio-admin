import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProductsTable } from '@/components/admin/tables/products-table'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Produk — Vour Studio Admin',
}

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!canRead(user, 'products')) notFound()

  const payload = await getPayload({ config })
  const initial = await payload.find({
    collection: 'products',
    limit: 10,
    sort: '-updatedAt',
    depth: 0,
  })

  return (
    <div>
      <PageHeader title="Produk" description="Template, starter kit, dan toolkit." />
      <Card>
        <CardContent className="pt-6">
          <ProductsTable
            canWrite={canWrite(user, 'products')}
            initialData={initial.docs}
            initialRowCount={initial.totalDocs}
          />
        </CardContent>
      </Card>
    </div>
  )
}
