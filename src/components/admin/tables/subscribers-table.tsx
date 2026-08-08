'use client'

import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import { useState } from 'react'

import type { NewsletterSubscriber } from '@/payload-types'
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
  ...(canWrite
    ? [
        {
          id: 'select',
          header: ({ table }: { table: Table<NewsletterSubscriber> }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Pilih semua"
            />
          ),
          cell: ({ row }: { row: Row<NewsletterSubscriber> }) => (
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
              canWrite={canWrite}
            />
          ),
          size: 50,
        },
      ]
    : []),
]

export function SubscribersTable({
  canWrite = false,
  initialData,
  initialRowCount,
}: {
  canWrite?: boolean
  initialData?: NewsletterSubscriber[]
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
    <CollectionList<NewsletterSubscriber>
      key={refreshKey}
      collection="newsletter-subscribers"
      initialData={stale ? undefined : initialData}
      initialRowCount={stale ? undefined : initialRowCount}
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
