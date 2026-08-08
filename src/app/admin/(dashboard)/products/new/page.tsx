import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { canWrite } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/get-current-user'
import { ProductForm } from '@/components/admin/product-form'

export const metadata: Metadata = {
  title: 'Produk Baru — Vour Studio Admin',
}

export default async function NewProductPage() {
  const user = await getCurrentUser()
  const write = canWrite(user, 'products')
  if (!write) notFound()

  return <ProductForm canWrite={write} />
}
