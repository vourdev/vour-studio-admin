'use client'

import {
  Check,
  CheckSquare,
  Eye,
  ImagePlus,
  Loader2,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Media } from '@/payload-types'
import { find, remove, bulkDelete, uploadMedia } from '@/lib/admin-api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function mediaUrl(media: Media): string {
  return media.sizes?.card?.url || media.url || ''
}

function fullMediaUrl(media: Media): string {
  return media.url || media.sizes?.card?.url || ''
}

function formatBytes(bytes?: number | null | string): string {
  if (!bytes) return '—'
  const num = typeof bytes === 'string' ? Number(bytes) : bytes
  if (isNaN(num)) return '—'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibrary({
  canWrite = false,
  initialMedia,
}: {
  canWrite?: boolean
  initialMedia?: Media[]
}) {
  const [media, setMedia] = useState<Media[]>(initialMedia ?? [])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialMedia)
  const [uploading, setUploading] = useState(false)
  const [alt, setAlt] = useState('')
  const [preview, setPreview] = useState<Media | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const skipInitialLoad = useRef(!initialMedia)

  const isAllSelected = media.length > 0 && media.every((m) => selectedIds.has(m.id))

  const load = async () => {
    setLoading(true)
    try {
      const res = await find<Media>('media', {
        limit: 100,
        sort: '-createdAt',
        where: search ? JSON.stringify({ filename: { contains: search } }) : undefined,
      })
      setMedia(res.docs)
    } catch {
      setMedia([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    const timer = setTimeout(() => void load(), search ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleUploadMultiple = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      toast.error('Pilih setidaknya satu file gambar yang valid.')
      return
    }

    setUploading(true)
    let successCount = 0
    try {
      for (const file of fileArray) {
        const fileAlt = alt || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        await uploadMedia(file, fileAlt)
        successCount++
      }
      toast.success(`${successCount} media berhasil diunggah.`)
      setAlt('')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah media.')
      await load()
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteSingle = async (id: number) => {
    try {
      await remove('media', id)
      toast.success('Media berhasil dihapus.')
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus media.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    try {
      const count = selectedIds.size
      await bulkDelete('media', Array.from(selectedIds))
      toast.success(`${count} media berhasil dihapus.`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus media terpilih.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(media.map((m) => m.id)))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canWrite && !uploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (!canWrite || uploading) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleUploadMultiple(e.dataTransfer.files)
    }
  }

  return (
    <div
      className="space-y-4 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative min-w-52 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari media berdasarkan nama…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {canWrite && media.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs h-9"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="mr-1.5 size-4 text-primary" />
                  Batal Pilih Semua
                </>
              ) : (
                <>
                  <Square className="mr-1.5 size-4 text-muted-foreground" />
                  Pilih Semua ({media.length})
                </>
              )}
            </Button>
          )}
        </div>

        {canWrite ? (
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) void handleUploadMultiple(files)
              }}
            />
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="gap-1.5"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Unggah Gambar
            </Button>
          </div>
        ) : null}
      </div>

      {canWrite ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Input
            className="max-w-xs h-8 text-xs"
            placeholder="Teks alternatif default (opsional)"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
          <span>Bisa memilih atau seret & lepas (*drag & drop*) banyak gambar sekaligus.</span>
        </div>
      ) : null}

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-xs text-primary">
          <Upload className="size-12 animate-bounce mb-2" />
          <p className="text-base font-semibold">Lepaskan file gambar untuk mengunggah</p>
          <p className="text-xs text-muted-foreground">Mendukung upload banyak file sekaligus</p>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {canWrite && selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium">{selectedIds.size} media dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="mr-1.5 size-3.5" />
              Batal Pilih
            </Button>

            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  disabled={bulkDeleting}
                >
                  <Trash2 className="size-3.5" />
                  Hapus Terpilih ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus {selectedIds.size} media terpilih?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {selectedIds.size} file media ini akan dihapus secara permanen dari database dan
                    storage Cloudflare R2. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={bulkDeleting}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    disabled={bulkDeleting}
                    onClick={(e) => {
                      e.preventDefault()
                      void handleBulkDelete()
                    }}
                  >
                    {bulkDeleting ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Menghapus…
                      </>
                    ) : (
                      'Ya, Hapus Semua'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-7 animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground border-2 border-dashed rounded-xl">
          <ImagePlus className="size-12 stroke-[1.5]" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Belum ada media</p>
            <p className="text-xs text-muted-foreground">
              Unggah gambar pertama Anda atau seret file ke sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {media.map((item) => {
            const isSelected = selectedIds.has(item.id)
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (canWrite && selectedIds.size > 0) {
                    toggleSelect(item.id)
                  } else {
                    setPreview(item)
                  }
                }}
                className={cn(
                  'group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary ring-2 ring-primary ring-offset-1 bg-primary/5'
                    : 'border-border/80 hover:border-border hover:shadow-sm',
                )}
              >
                {mediaUrl(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(item)}
                    alt={item.alt || item.filename || ''}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-8" />
                  </div>
                )}

                {/* Top Overlay: Checkbox & Quick Preview Button */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
                  {canWrite ? (
                    <div
                      onClick={(e) => toggleSelect(item.id, e)}
                      className={cn(
                        'flex size-6 items-center justify-center rounded-md transition-all cursor-pointer shadow-xs',
                        isSelected
                          ? 'bg-primary text-primary-foreground opacity-100 ring-2 ring-primary-foreground/40'
                          : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70',
                      )}
                    >
                      {isSelected ? (
                        <Check className="size-3.5 stroke-[3]" />
                      ) : (
                        <Checkbox
                          checked={false}
                          className="size-4 pointer-events-none border-white/80"
                        />
                      )}
                    </div>
                  ) : (
                    <span />
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-md bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 hover:text-white group-hover:opacity-100 shadow-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreview(item)
                    }}
                    title="Lihat ukuran penuh"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                </div>

                {/* Bottom Overlay: Filename & Delete Button */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium text-white"
                      title={item.filename || ''}
                    >
                      {item.filename}
                    </p>
                    {item.width && item.height ? (
                      <p className="text-[10px] text-white/70">
                        {item.width}×{item.height} · {formatBytes(item.filesize)}
                      </p>
                    ) : null}
                  </div>

                  {canWrite ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-white hover:bg-destructive hover:text-white transition-colors"
                          aria-label="Hapus media"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus media ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{item.filename}</strong> akan dihapus permanen dari storage R2
                            dan database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => void handleDeleteSingle(item.id)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox preview dialog */}
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>{preview.alt || preview.filename || 'Media'}</DialogTitle>
                <DialogDescription>
                  {preview.filename} · {preview.width ?? '—'}×{preview.height ?? '—'}px ·{' '}
                  {formatBytes(preview.filesize)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex max-h-[65vh] items-center justify-center overflow-hidden rounded-xl border bg-muted/40 p-2">
                {fullMediaUrl(preview) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fullMediaUrl(preview)}
                    alt={preview.alt || preview.filename || ''}
                    className="max-h-[60vh] max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <ImagePlus className="size-12" />
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
