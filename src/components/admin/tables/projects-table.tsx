'use client'

import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import type { Project } from '@/payload-types'
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

const useColumns = (onRefresh: () => void): ColumnDef<Project>[] => [
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
      <Link href={`/admin/projects/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'industry',
    header: 'Industri',
  },
  {
    accessorKey: 'year',
    header: 'Tahun',
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
        collection="projects"
        id={row.original.id}
        editHref={`/admin/projects/${row.original.id}`}
        onDeleted={onRefresh}
      />
    ),
    size: 50,
  },
]

export function ProjectsTable({ canWrite = false }: { canWrite?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const columns = useColumns(() => setRefreshKey((k) => k + 1))

  return (
    <CollectionList<Project>
      key={refreshKey}
      collection="projects"
      columns={columns}
      searchFields={['name', 'industry', 'challenge', 'solution']}
      defaultSort="-year"
      searchPlaceholder="Cari project…"
      emptyMessage="Belum ada project."
      enableBulkDelete={canWrite}
      toolbarActions={
        canWrite ? (
          <Button asChild size="sm">
            <Link href="/admin/projects/new">
              <Plus className="size-4" />
              Project Baru
            </Link>
          </Button>
        ) : null
      }
    />
  )
}
