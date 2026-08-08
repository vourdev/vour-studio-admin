import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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

  return (
    <div>
      <PageHeader title="Produk" description="Template, starter kit, dan toolkit." />
      <Card>
        <CardContent className="pt-6">
          <ProductsTable canWrite={canWrite(user, 'products')} />
        </CardContent>
      </Card>
    </div>
  )
}
