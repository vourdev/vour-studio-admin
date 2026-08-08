import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPayload } from 'payload'
import config from '@payload-config'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProductForm } from '@/components/admin/product-form'

export const metadata: Metadata = {
  title: 'Edit Produk — Vour Studio Admin',
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'products')) notFound()

  const payload = await getPayload({ config })
  const product = await payload.findByID({ collection: 'products', id }).catch(() => null)
  if (!product) notFound()

  return <ProductForm product={product} canWrite={canWrite(user, 'products')} />
}
