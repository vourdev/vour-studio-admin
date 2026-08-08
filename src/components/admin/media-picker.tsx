'use client'

import { ImagePlus, Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { Media } from '@/payload-types'
import { find } from '@/lib/admin-api'
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

  useEffect(() => {
    if (!open) return
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
  }, [open, search])

  const handleSelect = () => {
    if (!selected) return
    onChange(selected.id)
    setOpen(false)
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
          <DialogTitle>Pilih gambar</DialogTitle>
          <DialogDescription>
            Pilih dari library media. Gambar baru bisa diunggah di halaman Media.
          </DialogDescription>
        </DialogHeader>
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
                  'group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted transition-all',
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
        <div className="flex items-center justify-between gap-2">
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
            <Button type="button" onClick={handleSelect} disabled={!selected}>
              Pilih
            </Button>
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
