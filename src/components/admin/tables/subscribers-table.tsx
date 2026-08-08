'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'

import type { NewsletterSubscriber } from '@/payload-types'
import { DeleteSubscriberButton } from '@/components/admin/delete-subscriber-button'
import { CollectionList } from '@/components/admin/collection-list'
import { Checkbox } from '@/components/ui/checkbox'
import { TableActions } from '@/components/admin/table-actions'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const useColumns = (canWrite: boolean, onRefresh: () => void): ColumnDef<NewsletterSubscriber>[] => [
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
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Terdaftar',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  ...(canWrite
    ? [
        {
          id: 'actions',
          cell: ({ row }: { row: { original: NewsletterSubscriber } }) => (
            <TableActions
              collection="newsletter-subscribers"
              id={row.original.id}
              editHref={`#`}
              onDeleted={onRefresh}
            />
          ),
          size: 50,
        },
      ]
    : []),
]

export function SubscribersTable({ canWrite = false }: { canWrite?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const columns = useColumns(canWrite, () => setRefreshKey((k) => k + 1))

  return (
    <CollectionList<NewsletterSubscriber>
      key={refreshKey}
      collection="newsletter-subscribers"
      columns={columns}
      searchFields={['email']}
      defaultSort="-createdAt"
      pageSize={50}
      searchPlaceholder="Cari email…"
      emptyMessage="Belum ada subscriber."
      enableBulkDelete={canWrite}
    />
  )
}
