'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CloudUpload, ExternalLink, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { Post } from '@/payload-types'
import { create, update } from '@/lib/admin-api'
import { useAutosaveDraft } from '@/hooks/use-autosave-draft'
import { DraftRestoreBanner } from '@/components/admin/draft-restore-banner'
import { RichTextEditor, type RichTextValue } from '@/components/admin/rich-text-editor'
import { MediaPicker } from '@/components/admin/media-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const EMPTY_CONTENT: RichTextValue = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        children: [],
      },
    ],
  },
}

type PostDraft = {
  title: string
  slug: string
  description: string
  category: 'Tutorial' | 'Case Study' | 'Dev Notes'
  date: string
  readingMinutes: number
  image: number | null
  content: RichTextValue
  related: { label: string; href: string }[]
}

export function PostForm({
  post,
  previewUrl,
  canWrite = false,
}: {
  post?: Post
  previewUrl?: string | null
  canWrite?: boolean
}) {
  const router = useRouter()
  const isEdit = Boolean(post)

  const [data, setData] = useState<PostDraft>({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    description: post?.description ?? '',
    category: post?.category ?? 'Dev Notes',
    date: post?.date
      ? new Date(post.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    readingMinutes: post?.readingMinutes ?? 5,
    image: post?.image && typeof post.image !== 'number' ? post.image.id : (post?.image as number | null) ?? null,
    content: post?.content ?? EMPTY_CONTENT,
    related: post?.related?.map(({ label, href }) => ({ label, href })) ?? [],
  })
  const [saving, setSaving] = useState(false)

  const { pendingDraft, lastSavedAt, error, isSaving, restore, discard, clear } = useAutosaveDraft<PostDraft>({
    storageKey: `vour:post:draft:${post?.id ?? 'new'}`,
    data,
  })

  const handleRestore = () => {
    const draft = restore()
    if (draft) setData(draft)
  }

  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const slugify = (val: string) =>
    val
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
      .toLowerCase()

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        ...data,
        image: data.image ?? null,
        content: data.content,
        related: data.related.map((row) => ({ ...row })) || null,
        date: data.date ? new Date(data.date).toISOString() : undefined,
        _status: targetStatus,
      }

      if (isEdit) {
        await update<Post>('posts', post!.id, payload, { draft: targetStatus === 'draft' })
        toast.success('Postingan berhasil disimpan.')
      } else {
        await create<Post>('posts', payload, { draft: targetStatus === 'draft' })
        toast.success('Postingan berhasil dibuat.')
      }
      clear()
      router.push('/admin/posts')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan postingan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/posts')} aria-label="Kembali">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? 'Edit Postingan' : 'Postingan Baru'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Simpan sebagai draft atau langsung publikasikan.
          </p>
        </div>
        {previewUrl && post?._status === 'published' ? (
          <Button asChild variant="outline">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Lihat di situs
            </a>
          </Button>
        ) : previewUrl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="outline" disabled aria-label="Preview belum tersedia">
                  <ExternalLink className="size-4" />
                  Lihat di situs
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Publikasikan dulu untuk melihat artikel di marketing site.</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="space-y-6">
        {pendingDraft ? (
          <DraftRestoreBanner savedAt={pendingDraft.savedAt} onRestore={handleRestore} onDiscard={discard} />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Konten</CardTitle>
            <CardDescription>Informasi utama artikel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Judul artikel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Kosongkan untuk otomatis dari judul.
                </span>
              </Label>
              <Input
                id="slug"
                value={data.slug}
                onChange={(e) => set('slug', e.target.value)}
                onBlur={() => {
                  if (!data.slug && data.title) set('slug', slugify(data.title))
                }}
                placeholder="judul-artikel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Ringkasan singkat artikel"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Konten *</Label>
              <RichTextEditor value={data.content} onChange={(content) => set('content', content)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengaturan</CardTitle>
            <CardDescription>Kategori, tanggal, dan gambar sampul.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={data.category}
                  onValueChange={(v) => set('category', v as PostDraft['category'])}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Tutorial', 'Case Study', 'Dev Notes'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={data.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="readingMinutes">Menit membaca</Label>
              <Input
                id="readingMinutes"
                type="number"
                min={1}
                max={60}
                value={data.readingMinutes}
                onChange={(e) => set('readingMinutes', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gambar sampul</Label>
              <div className="flex flex-wrap items-center gap-3">
                <MediaPicker
                  value={data.image}
                  onChange={(id) => set('image', id)}
                  triggerLabel={data.image ? 'Ganti gambar' : 'Pilih gambar'}
                />
                {data.image ? (
                  <span className="text-sm text-muted-foreground">
                    ID media: {data.image}
                  </span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tautan terkait</CardTitle>
            <CardDescription>Tautan internal ke layanan atau produk terkait.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.related.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada tautan terkait.</p>
            ) : (
              data.related.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={row.label}
                    placeholder="Label (mis. Layanan Desain)"
                    onChange={(e) => {
                      const next = [...data.related]
                      next[i] = { ...row, label: e.target.value }
                      set('related', next)
                    }}
                  />
                  <Input
                    value={row.href}
                    placeholder="/layanan/desain"
                    onChange={(e) => {
                      const next = [...data.related]
                      next[i] = { ...row, href: e.target.value }
                      set('related', next)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => set('related', data.related.filter((_, j) => j !== i))}
                    aria-label="Hapus tautan"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))
            )}
            {data.related.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set('related', [...data.related, { label: '', href: '' }])}
              >
                Tambah tautan
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {error ? (
              <>
                <AlertTriangle className="size-3.5 text-destructive" aria-hidden />
                <span className="text-destructive">Autosave gagal — simpan manual.</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Menyimpan draft otomatis…
              </>
            ) : lastSavedAt ? (
              <>
                <CloudUpload className="size-3.5" aria-hidden />
                Tersimpan otomatis{' '}
                {new Date(lastSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </div>
          {canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" disabled={saving} onClick={() => handleSave('draft')}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Simpan Draft
              </Button>
              <Button disabled={saving} onClick={() => handleSave('published')}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {post?._status === 'published' ? 'Perbarui & Publikasikan' : 'Publikasikan'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Anda hanya memiliki akses baca untuk koleksi ini.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
