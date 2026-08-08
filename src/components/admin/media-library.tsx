'use client'

import { ImagePlus, Loader2, Search, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { Media } from '@/payload-types'
import { find, remove, uploadMedia } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'
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

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibrary({
  canWrite = false,
  initialMedia,
}: {
  canWrite?: boolean
  /** First page rendered server-side (Local API) — shown immediately, then refreshed in the background. */
  initialMedia?: Media[]
}) {
  const [media, setMedia] = useState<Media[]>(initialMedia ?? [])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(!initialMedia)
  const [uploading, setUploading] = useState(false)
  const [alt, setAlt] = useState('')
  const [preview, setPreview] = useState<Media | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // The server already rendered the library — skip the mount fetch so visiting
  // the page doesn't duplicate the SSR query with a REST call. Search/upload/
  // delete still refetch as usual.
  const skipInitialLoad = useRef(!initialMedia)

  const load = async () => {
    setLoading(true)
    try {
      const res = await find<Media>('media', {
        limit: 60,
        sort: '-createdAt',
        where: search
          ? JSON.stringify({ filename: { contains: search } })
          : undefined,
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

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      await uploadMedia(file, alt || file.name)
      toast.success('Media berhasil diunggah.')
      setAlt('')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah media.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await remove('media', id)
      toast.success('Media dihapus.')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus media.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari media…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canWrite ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUpload(file)
              }}
            />
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Unggah
            </Button>
          </>
        ) : null}
      </div>

      {canWrite ? (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-xs"
            placeholder="Teks alternatif (alt) untuk upload"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">
            Wajib diisi agar gambar dapat diakses.
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <ImagePlus className="size-10" />
          <p className="text-sm">Belum ada media.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <div key={item.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              <button
                type="button"
                onClick={() => setPreview(item)}
                className="block size-full cursor-zoom-in"
                aria-label={`Lihat preview ${item.alt || item.filename || ''}`}
              >
                {mediaUrl(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(item)}
                    alt={item.alt || item.filename || ''}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-8" />
                  </div>
                )}
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <p className="truncate text-xs text-white" title={item.filename || ''}>
                  {item.filename}
                </p>
                {canWrite ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-white hover:bg-white/20 hover:text-white"
                        aria-label="Hapus media"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus media ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {item.filename} akan dihapus permanen dari storage dan semua dokumen yang
                          memakainya.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => void handleDelete(item.id)}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
              <p className="absolute left-2 top-2 max-w-[90%] truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {item.alt}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox preview — klik gambar untuk melihat versi penuh */}
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
              <div className="flex max-h-[65vh] items-center justify-center overflow-hidden rounded-md border bg-muted">
                {fullMediaUrl(preview) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fullMediaUrl(preview)}
                    alt={preview.alt || preview.filename || ''}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center p-10 text-muted-foreground">
                    <ImagePlus className="size-10" />
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
