'use client'

import Link from 'next/link'
import type { ColumnDef, Row, Table } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import type { Post } from '@/payload-types'
import { StatusBadge } from '@/components/admin/status-badge'
import { CollectionList } from '@/components/admin/collection-list'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableActions } from '@/components/admin/table-actions'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const useColumns = (canWrite: boolean, onRefresh: () => void): ColumnDef<Post>[] => [
  ...(canWrite
    ? [
        {
          id: 'select',
    header: ({ table }: { table: Table<Post> }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua"
      />
    ),
    cell: ({ row }: { row: Row<Post> }) => (
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
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => (
      <Link href={`/admin/posts/${row.original.id}`} className="font-medium hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Kategori',
  },
  {
    accessorKey: '_status',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original._status || (row.original as any).status || 'draft'
      return <StatusBadge status={status} />
    },
  },
  {
    accessorKey: 'date',
    header: 'Tanggal',
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.date)}</span>,
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
        collection="posts"
        id={row.original.id}
        editHref={`/admin/posts/${row.original.id}`}
        onDeleted={onRefresh}
        canWrite={canWrite}
      />
    ),
    size: 50,
  },
]

export function PostsTable({
  canWrite = false,
  initialData,
  initialRowCount,
}: {
  canWrite?: boolean
  initialData?: Post[]
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
    <CollectionList<Post>
      key={refreshKey}
      collection="posts"
      initialData={stale ? undefined : initialData}
      initialRowCount={stale ? undefined : initialRowCount}
      columns={columns}
      searchFields={['title', 'description', 'slug']}
      defaultSort="-date"
      searchPlaceholder="Cari postingan…"
      emptyMessage="Belum ada postingan."
      extraQuery={{ draft: 'true' }}
      enableBulkDelete={canWrite}
      toolbarActions={
        canWrite ? (
          <Button asChild size="sm">
            <Link href="/admin/posts/new">
              <Plus className="size-4" />
              Postingan Baru
            </Link>
          </Button>
        ) : null
      }
    />
  )
}
