'use client'

import * as React from 'react'
import {
  type Column,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SearchX,
  Trash2,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/**
 * The page numbers to show in the pagination bar — first, last, the pages
 * around the current one, with ellipses in between.
 */
function getPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('…')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 1) items.push('…')
  items.push(total)
  return items
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  rowCount: number
  page: number
  pageSize: number
  sorting: SortingState
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>
  loading?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  toolbarActions?: React.ReactNode
  emptyMessage?: string
  enableRowSelection?: boolean
  onBulkDelete?: (ids: (string | number)[]) => Promise<void>
  getRowId?: (row: TData) => string | number
}

function SortableHeader<TData>({
  column,
  label,
  children,
}: {
  column: Column<TData, unknown>
  label?: string
  children?: React.ReactNode
}) {
  if (!column.getCanSort()) {
    return <span>{children ?? label}</span>
  }
  const sorted = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground',
        sorted ? 'text-foreground' : 'text-muted-foreground',
      )}
      aria-label={`Urutkan ${label}`}
    >
      {children ?? label}
      {sorted === 'asc' ? (
        <ArrowUp className="size-3.5" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDown className="size-3.5" aria-hidden />
      ) : (
        <ChevronsUpDown className="size-3.5" aria-hidden />
      )}
    </button>
  )
}

export function DataTable<TData>({
  columns,
  data,
  rowCount,
  page,
  pageSize,
  sorting,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  loading = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari…',
  toolbarActions,
  emptyMessage = 'Belum ada data.',
  enableRowSelection = false,
  onBulkDelete,
  getRowId,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [deleting, setDeleting] = React.useState(false)

  // TanStack Table's useReactTable() returns imperative functions that the
  // React Compiler cannot memoize — informational only (component skips
  // auto-memoization); the table still works as expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(rowCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => String(getRowId(row)) : undefined,
    enableRowSelection,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedCount === 0) return
    setDeleting(true)
    try {
      const ids = selectedRows.map((row) => getRowId?.(row.original) ?? row.id)
      await onBulkDelete(ids)
      setRowSelection({})
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize))
  const showPagination = totalPages > 1

  return (
    <div className="space-y-4">
      {(onSearchChange || toolbarActions || (enableRowSelection && selectedCount > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onSearchChange ? (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 pr-8"
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {enableRowSelection && selectedCount > 0 && onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Hapus {selectedCount} data
              </Button>
            )}
            {toolbarActions}
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-lg border">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const column = header.column
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <SortableHeader<TData>
                          column={column}
                          label={typeof column.columnDef.header === 'string' ? column.columnDef.header : undefined}
                        >
                          {flexRender(column.columnDef.header, header.getContext())}
                        </SortableHeader>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <SearchX className="size-8" aria-hidden />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground tabular-nums">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Memuat…
            </span>
          ) : (
            <>
              {rowCount} data · halaman {page} dari {totalPages}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {onPageSizeChange ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Tampilkan
              <Select
                value={String(pageSize)}
                onValueChange={(v) => onPageSizeChange(Number(v))}
                disabled={loading}
              >
                <SelectTrigger className="h-8 w-[74px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              per halaman
            </div>
          ) : null}
          {showPagination && (
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {getPageItems(page, totalPages).map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden>
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? 'default' : 'outline'}
                    size="icon"
                    className="size-8"
                    disabled={loading}
                    onClick={() => onPageChange(item)}
                    aria-label={`Halaman ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                  >
                    {item}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
