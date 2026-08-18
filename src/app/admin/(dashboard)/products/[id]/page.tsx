import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canRead, canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProductForm } from '@/components/admin/product-form'
import { fetchFullDoc } from '@/lib/crud'
import { products } from '@/db/schema'

export const metadata: Metadata = {
  title: 'Edit Produk — Vour Studio Admin',
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!canRead(user, 'products')) notFound()

  const product = (await fetchFullDoc('products', products, isNaN(Number(id)) ? id : Number(id))) as any
  if (!product) notFound()

  return <ProductForm product={product} canWrite={canWrite(user, 'products')} />
}
