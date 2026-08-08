'use client'

import * as React from 'react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'

import { find, bulkDelete } from '@/lib/admin-api'
import { DataTable, PAGE_SIZE_OPTIONS } from '@/components/admin/data-table'

/**
 * Fetches a Payload collection from the REST API on the client (cookie auth)
 * and renders it in a shadcn DataTable with debounced search, column sorting
 * and pagination. Access control is enforced server-side by Payload.
 */
export function CollectionList<T extends { id: number | string }>({
  collection,
  columns,
  searchFields = [],
  defaultSort = '-createdAt',
  pageSize: initialPageSize = 10,
  searchPlaceholder,
  toolbarActions,
  emptyMessage,
  extraQuery = {},
  enableBulkDelete = false,
  initialData,
  initialRowCount,
}: {
  collection: string
  columns: ColumnDef<T>[]
  searchFields?: string[]
  defaultSort?: string
  pageSize?: number
  searchPlaceholder?: string
  toolbarActions?: React.ReactNode
  emptyMessage?: string
  extraQuery?: Record<string, unknown>
  enableBulkDelete?: boolean
  /** First page rendered server-side (Local API) — shown immediately, no mount re-fetch. */
  initialData?: T[]
  initialRowCount?: number
}) {
  const [data, setData] = React.useState<T[]>(initialData ?? [])
  const [rowCount, setRowCount] = React.useState(initialRowCount ?? initialData?.length ?? 0)
  const [page, setPage] = React.useState(1)
  // Clamp to the page-size options offered by the DataTable so the Select
  // always has a matching item (the prop only seeds the initial value).
  const [pageSize, setPageSize] = React.useState(
    PAGE_SIZE_OPTIONS.includes(initialPageSize) ? initialPageSize : PAGE_SIZE_OPTIONS[0],
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [loading, setLoading] = React.useState(!initialData)
  const [refreshKey, setRefreshKey] = React.useState(0)
  // The server already rendered the first page — skip the mount fetch entirely
  // so navigating to a list doesn't duplicate the SSR query with a REST call.
  // Remounts after a client-side delete pass no initialData (tables mark the
  // seed stale), so those fetch fresh rows with the skeleton as before.
  const skipInitialFetch = React.useRef(Boolean(initialData))

  // Callers pass object/array literals that are recreated on every parent
  // render. Without these memoized, reference-stable versions the fetch effect
  // below would re-run forever (each fetch → setState → re-render → new
  // reference → fetch …), hammering the API in an infinite loop.
  const extraQueryKey = React.useMemo(() => JSON.stringify(extraQuery), [extraQuery])
  // Deliberately keyed on the serialized value, not the object reference: callers
  // pass fresh object/array literals on every render, so depending on the value
  // directly would re-trigger the fetch effect in an infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableExtraQuery = React.useMemo(() => extraQuery, [extraQueryKey])
  const searchFieldsKey = React.useMemo(() => JSON.stringify(searchFields), [searchFields])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSearchFields = React.useMemo(() => searchFields, [searchFieldsKey])

  // Debounce the search input so we don't hit the API on every keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const where = React.useMemo(() => {
    const term = debouncedSearch.trim()
    if (!term || stableSearchFields.length === 0) return undefined
    return JSON.stringify({
      or: stableSearchFields.map((field) => ({ [field]: { contains: term } })),
    })
  }, [debouncedSearch, stableSearchFields])

  const sortParam = React.useMemo(() => {
    if (sorting.length === 0) return defaultSort
    const s = sorting[0]
    return `${s.desc ? '-' : ''}${s.id}`
  }, [sorting, defaultSort])

  React.useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      find<T>(collection, {
        page,
        limit: pageSize,
        sort: sortParam,
        where,
        // Tables only render scalar fields — skip relationship population to
        // keep responses small (no embedded media docs in every row).
        depth: 0,
        ...stableExtraQuery,
      })
        .then((res) => {
          if (cancelled) return
          setData(res.docs)
          setRowCount(res.totalDocs)
        })
        .catch(() => {
          if (cancelled) return
          setData([])
          setRowCount(0)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [collection, page, pageSize, sortParam, where, stableExtraQuery, refreshKey])

  const handleBulkDelete = React.useCallback(
    async (ids: (string | number)[]) => {
      try {
        await bulkDelete(collection, ids)
        toast.success(`${ids.length} data berhasil dihapus.`)
        setRefreshKey((k) => k + 1)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal menghapus data.')
        throw error
      }
    },
    [collection],
  )

  return (
    <DataTable<T>
      columns={columns}
      data={data}
      rowCount={rowCount}
      page={page}
      pageSize={pageSize}
      sorting={sorting}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size)
        setPage(1)
      }}
      onSortingChange={(updater) => {
        setSorting(updater)
        setPage(1)
      }}
      loading={loading}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder}
      toolbarActions={toolbarActions}
      emptyMessage={emptyMessage}
      enableRowSelection={enableBulkDelete}
      onBulkDelete={enableBulkDelete ? handleBulkDelete : undefined}
      getRowId={(row) => row.id}
    />
  )
}
