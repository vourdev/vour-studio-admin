'use client'

import { ImagePlus, Loader2, Search, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { Media } from '@/payload-types'
import { find, uploadMedia } from '@/lib/admin-api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function mediaUrl(media: Media): string {
  return media.sizes?.card?.url || media.url || ''
}

export function MediaPicker({
  value,
  onChange,
  triggerLabel = 'Pilih gambar',
}: {
  value?: number | string | null
  onChange: (id: number | null) => void
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<Media[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Media | null>(null)

  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open || tab !== 'library') return
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      find<Media>('media', {
        limit: 48,
        sort: '-createdAt',
        where: search ? JSON.stringify({ filename: { contains: search } }) : undefined,
      })
        .then((res) => {
          if (!cancelled) setMedia(res.docs)
        })
        .catch(() => {
          if (!cancelled) setMedia([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, search, tab])

  const handleSelect = () => {
    if (!selected) return
    onChange(selected.id)
    setOpen(false)
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const res = (await uploadMedia(uploadFile, altText || uploadFile.name.split('.')[0] || 'Image')) as any
      if (res && res.id) {
        onChange(res.id)
        setOpen(false)
        setAltText('')
        setUploadFile(null)
      } else {
        toast.error('Gagal mengunggah gambar.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengunggah gambar.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ImagePlus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pilih atau Unggah Gambar</DialogTitle>
          <DialogDescription>
            Pilih gambar dari library media atau langsung unggah file baru.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex border-b border-border mr-auto w-full gap-4">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={cn(
              'pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer',
              tab === 'library'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Pilih dari Library
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={cn(
              'pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer',
              tab === 'upload'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Unggah Baru
          </button>
        </div>

        {tab === 'library' ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari berdasarkan nama file…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : media.length === 0 ? (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  Tidak ada media.
                </div>
              ) : (
                media.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={cn(
                      'group relative aspect-video overflow-hidden rounded-md border bg-muted transition-all',
                      selected?.id === item.id
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-border',
                    )}
                  >
                    {mediaUrl(item) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(item)}
                        alt={item.alt || item.filename || ''}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="size-6" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Pilih File Gambar</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setUploadFile(file)
                  if (file && !altText) {
                    setAltText(file.name.replace(/\.[^/.]+$/, ""))
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Rekomendasi: 1280×720 piksel (rasio 16:9) agar pas dengan card layout produk.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt-text">Deskripsi Alternatif (Alt Text) *</Label>
              <Input
                id="alt-text"
                placeholder="Deskripsi untuk keterbacaan/SEO"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          {value ? (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              Hapus pilihan
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            {tab === 'library' ? (
              <Button type="button" onClick={handleSelect} disabled={!selected}>
                Pilih
              </Button>
            ) : (
              <Button type="button" onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                    Mengunggah…
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-1.5" />
                    Unggah & Pilih
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MediaThumb({ media }: { media?: Media | number | null }) {
  if (!media || typeof media === 'number') return null
  const url = mediaUrl(media)
  if (!url) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={media.alt || media.filename || ''}
      className="h-10 w-14 rounded-md object-cover"
    />
  )
}
