'use client'

import { useRef, useState, useEffect } from 'react'
import {
  UploadCloud,
  Loader2,
  Trash2,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Media } from '@/payload-types'
import { uploadMedia, find, findOne } from '@/lib/admin-api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

function getMediaUrl(m?: Partial<Media> | null): string {
  if (!m) return ''
  const sizes = m.sizes as { card?: { url?: string | null }; og?: { url?: string | null } } | undefined
  const sizesCardUrl = (m as { sizesCardUrl?: string }).sizesCardUrl
  const sizesOgUrl = (m as { sizesOgUrl?: string }).sizesOgUrl
  return sizes?.card?.url || sizesCardUrl || sizes?.og?.url || sizesOgUrl || m.url || ''
}

export function ImageUpload({
  value,
  initialMedia,
  onChange,
  disabled = false,
  className,
  aspectRatio = '16/9',
  recommendedText = 'Rekomendasi rasio 16:9 (1280×720 piksel), maks. 4.5MB',
}: {
  value?: number | string | null
  initialMedia?: Media | null
  onChange: (id: number | null, media?: Media | null) => void
  disabled?: boolean
  className?: string
  aspectRatio?: string
  recommendedText?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedMedia, setUploadedMedia] = useState<Media | null>(initialMedia ?? null)
  const [localBlobUrl, setLocalBlobUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Library modal state (optional secondary picker)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryMedia, setLibraryMedia] = useState<Media[]>([])
  const [search, setSearch] = useState('')
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<Media | null>(null)

  // Fetch media document when value exists and is not yet loaded in state
  useEffect(() => {
    let cancelled = false
    if (value && typeof value === 'number' && (!uploadedMedia || uploadedMedia.id !== value)) {
      findOne<Media>('media', value)
        .then((doc) => {
          if (!cancelled && doc) {
            setUploadedMedia(doc)
          }
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [value, uploadedMedia])

  // Determine active media object and preview URL
  const activeMedia = value ? (uploadedMedia && uploadedMedia.id === value ? uploadedMedia : null) : null
  const previewUrl = localBlobUrl || (activeMedia ? getMediaUrl(activeMedia) : '')

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Client validation
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, WebP, dll).')
      return
    }

    if (file.size > 4.5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 4.5MB.')
      return
    }

    // Generate local preview while uploading
    const localUrl = URL.createObjectURL(file)
    setLocalBlobUrl(localUrl)
    setUploading(true)

    try {
      const altText = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      const res = (await uploadMedia(file, altText)) as Media

      if (res && res.id) {
        setUploadedMedia(res)
        setLocalBlobUrl('')
        onChange(res.id, res)
        toast.success('Gambar berhasil diunggah.')
      } else {
        throw new Error('Gagal memproses gambar.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah gambar.')
      setLocalBlobUrl('')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) {
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
    if (disabled || uploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleRemove = () => {
    setUploadedMedia(null)
    setLocalBlobUrl('')
    onChange(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Library picker logic
  useEffect(() => {
    if (!libraryOpen) return
    let cancelled = false
    const timer = setTimeout(() => {
      setLoadingLibrary(true)
      find<Media>('media', {
        limit: 36,
        sort: '-createdAt',
        where: search ? JSON.stringify({ filename: { contains: search } }) : undefined,
      })
        .then((res) => {
          if (!cancelled) setLibraryMedia(res.docs)
        })
        .catch(() => {
          if (!cancelled) setLibraryMedia([])
        })
        .finally(() => {
          if (!cancelled) setLoadingLibrary(false)
        })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [libraryOpen, search])

  const handleSelectFromLibrary = () => {
    if (!selectedLibraryItem) return
    setUploadedMedia(selectedLibraryItem)
    setLocalBlobUrl('')
    onChange(selectedLibraryItem.id, selectedLibraryItem)
    setLibraryOpen(false)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
        }}
      />

      {previewUrl ? (
        <div className="relative group overflow-hidden rounded-xl border border-border bg-muted/20">
          <div
            className="relative w-full overflow-hidden bg-zinc-950 flex items-center justify-center"
            style={{ aspectRatio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={activeMedia?.alt || activeMedia?.filename || 'Thumbnail'}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {uploading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                <Loader2 className="size-8 animate-spin mb-2 text-primary" />
                <p className="text-sm font-medium">Mengunggah gambar…</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-card border-t border-border">
            <div className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span className="truncate font-medium text-foreground">
                {activeMedia?.filename || activeMedia?.alt || 'Gambar terpilih'}
              </span>
              {activeMedia?.id && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px]">
                  ID: {activeMedia.id}
                </span>
              )}
            </div>

            {!disabled && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Ganti
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  disabled={uploading}
                  onClick={() => setLibraryOpen(true)}
                  title="Pilih dari library media yang sudah ada"
                >
                  <FolderOpen className="mr-1.5 size-3.5" />
                  Library
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={uploading}
                  onClick={handleRemove}
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Hapus
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            if (!disabled && !uploading) fileInputRef.current?.click()
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
              : 'border-border/80 hover:border-primary/50 hover:bg-muted/40 bg-card',
            disabled && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Sedang mengunggah gambar…</p>
              <p className="text-xs text-muted-foreground">Menyimpan dan mengompresi gambar.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <UploadCloud className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-primary underline-offset-4 group-hover:underline">
                    Klik untuk unggah gambar
                  </span>{' '}
                  atau seret dan lepas di sini
                </p>
                <p className="text-xs text-muted-foreground">{recommendedText}</p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLibraryOpen(true)
                  }}
                >
                  <FolderOpen className="mr-1.5 size-3.5" />
                  Pilih dari Library Media
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Secondary Library Modal Picker */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pilih dari Library Media</DialogTitle>
            <DialogDescription>
              Pilih gambar yang sebelumnya sudah pernah diunggah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari berdasarkan nama file…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 p-1">
              {loadingLibrary ? (
                <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : libraryMedia.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  Tidak ada media ditemukan.
                </div>
              ) : (
                libraryMedia.map((item) => {
                  const url = getMediaUrl(item)
                  const isSelected = selectedLibraryItem?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedLibraryItem(item)}
                      className={cn(
                        'group relative aspect-video overflow-hidden rounded-md border bg-muted transition-all cursor-pointer text-left',
                        isSelected
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-transparent hover:border-border'
                      )}
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={item.alt || item.filename || ''}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-6" />
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setLibraryOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSelectFromLibrary}
                disabled={!selectedLibraryItem}
              >
                Gunakan Gambar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
