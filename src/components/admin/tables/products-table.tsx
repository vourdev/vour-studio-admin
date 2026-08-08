'use client'

import Link from 'next/link'
import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import type { Product } from '@/payload-types'
import { StatusBadge } from '@/components/admin/status-badge'
import { CollectionList } from '@/components/admin/collection-list'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableActions } from '@/components/admin/table-actions'

const formatPrice = (price: number | null | undefined) =>
  typeof price === 'number' ? `Rp ${new Intl.NumberFormat('id-ID').format(price)}` : '—'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const useColumns = (canWrite: boolean, onRefresh: () => void): ColumnDef<Product>[] => [
  ...(canWrite
    ? [
        {
          id: 'select',
    header: ({ table }: { table: Table<Product> }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }: { row: Row<Product> }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
      />
    ),
          enableSorting: false,
          size: 40,
        },
      ]
    : []),
  {
    accessorKey: 'name',
    header: 'Nama',
    cell: ({ row }) => (
      <Link href={`/admin/products/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Kategori',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} type="product" />,
  },
  {
    accessorKey: 'price',
    header: 'Harga',
    cell: ({ row }) => <span className="tabular-nums">{formatPrice(row.original.price)}</span>,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Diperbarui',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <TableActions
        collection="products"
        id={row.original.id}
        editHref={`/admin/products/${row.original.id}`}
        onDeleted={onRefresh}
        canWrite={canWrite}
      />
    ),
    size: 50,
  },
]

export function ProductsTable({
  canWrite = false,
  initialData,
  initialRowCount,
}: {
  canWrite?: boolean
  initialData?: Product[]
  initialRowCount?: number
}) {
  const [refreshKey, setRefreshKey] = useState(0)
  // After a client-side delete the server-rendered initialData is stale — don't
  // reseed from it on remount, fetch fresh rows instead (avoids the deleted row
  // flashing back).
  const [stale, setStale] = useState(false)
  const columns = useColumns(canWrite, () => {
    setStale(true)
    setRefreshKey((k) => k + 1)
  })

  return (
    <CollectionList<Product>
      key={refreshKey}
      collection="products"
      initialData={stale ? undefined : initialData}
      initialRowCount={stale ? undefined : initialRowCount}
      columns={columns}
      searchFields={['name', 'tagline', 'slug']}
      defaultSort="-updatedAt"
      searchPlaceholder="Cari produk…"
      emptyMessage="Belum ada produk."
      enableBulkDelete={canWrite}
      toolbarActions={
        canWrite ? (
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              Produk Baru
            </Link>
          </Button>
        ) : null
      }
    />
  )
}
