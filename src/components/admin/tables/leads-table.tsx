'use client'

import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'

import type { Lead } from '@/payload-types'
import { StatusBadge } from '@/components/admin/status-badge'
import { CollectionList } from '@/components/admin/collection-list'
import { Checkbox } from '@/components/ui/checkbox'
import { TableActions } from '@/components/admin/table-actions'

const formatDate = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const useColumns = (onRefresh: () => void): ColumnDef<Lead>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
      />
    ),
    enableSorting: false,
    size: 40,
  },
  {
    accessorKey: 'name',
    header: 'Nama',
    cell: ({ row }) => (
      <Link href={`/admin/leads/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'sourcePage',
    header: 'Sumber',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} type="lead" />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <TableActions
        collection="leads"
        id={row.original.id}
        editHref={`/admin/leads/${row.original.id}`}
        onDeleted={onRefresh}
      />
    ),
    size: 50,
  },
]

export function LeadsTable() {
  const [refreshKey, setRefreshKey] = useState(0)
  const columns = useColumns(() => setRefreshKey((k) => k + 1))

  return (
    <CollectionList<Lead>
      key={refreshKey}
      collection="leads"
      columns={columns}
      searchFields={['name', 'email', 'message', 'whatsapp']}
      defaultSort="-createdAt"
      searchPlaceholder="Cari lead…"
      emptyMessage="Belum ada leads."
      enableBulkDelete
    />
  )
}
