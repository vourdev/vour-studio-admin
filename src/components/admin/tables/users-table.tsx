'use client'

import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import type { User } from '@/payload-types'
import { CollectionList } from '@/components/admin/collection-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableActions } from '@/components/admin/table-actions'
import { PERMISSIONABLE_COLLECTIONS } from '@/lib/permissions'

const permissionSummary = (user: User): string => {
  if (user.roles.includes('admin')) return 'Semua' // admin = akses penuh
  const readable = (user.permissions ?? []).filter((p) => p.canRead).length
  const writable = (user.permissions ?? []).filter((p) => p.canWrite).length
  if (readable === 0) return 'Tidak ada'
  return `${readable}/${PERMISSIONABLE_COLLECTIONS.length} koleksi · ${writable} tulis`
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const useColumns = (onRefresh: () => void): ColumnDef<User>[] => [
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
      <Link href={`/admin/users/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'roles',
    header: 'Peran',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.roles.map((role) => (
          <Badge key={role} variant="secondary">
            {role}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'permissions',
    header: 'Izin',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{permissionSummary(row.original)}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Dibuat',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <TableActions
        collection="users"
        id={row.original.id}
        editHref={`/admin/users/${row.original.id}`}
        onDeleted={onRefresh}
      />
    ),
    size: 50,
  },
]

export function UsersTable() {
  const [refreshKey, setRefreshKey] = useState(0)
  const columns = useColumns(() => setRefreshKey((k) => k + 1))

  return (
    <CollectionList<User>
      key={refreshKey}
      collection="users"
      columns={columns}
      searchFields={['name', 'email']}
      defaultSort="email"
      searchPlaceholder="Cari pengguna…"
      emptyMessage="Belum ada pengguna."
      enableBulkDelete
      toolbarActions={
        <Button asChild size="sm">
          <Link href="/admin/users/new">
            <Plus className="size-4" />
            Pengguna Baru
          </Link>
        </Button>
      }
    />
  )
}
