'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertTriangle, ArrowLeft, CloudUpload, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Post } from '@/payload-types'
import { create, update } from '@/lib/admin-api'
import { formatSlug } from '@/lib/format-slug'
import { ImageUpload } from '@/components/admin/image-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAutosaveDraft } from '@/hooks/use-autosave-draft'
import { DraftRestoreBanner } from '@/components/admin/draft-restore-banner'

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-48 items-center justify-center rounded-md border bg-muted/40 text-sm text-muted-foreground">
        Memuat editor…
      </div>
    ),
  },
)

const EMPTY_CONTENT = {
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
  content: any
}

export function PostForm({
  post,
  previewUrl: initialPreviewUrl,
  canWrite = false,
  marketingSiteUrl = '',
}: {
  post?: Post
  previewUrl?: string | null
  canWrite?: boolean
  marketingSiteUrl?: string
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
  })
  const [isCustomSlug, setIsCustomSlug] = useState(
    Boolean(isEdit && post?.slug && post?.title && post.slug !== formatSlug(post.title))
  )
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

  const handleTitleChange = (title: string) => {
    setData((prev) => ({
      ...prev,
      title,
      slug: !isCustomSlug ? formatSlug(title) : prev.slug,
    }))
  }

  const handleSlugChange = (slug: string) => {
    setIsCustomSlug(true)
    set('slug', slug)
  }

  const handleSyncSlug = () => {
    setIsCustomSlug(false)
    setData((prev) => ({
      ...prev,
      slug: formatSlug(prev.title),
    }))
  }

  const handleSlugBlur = () => {
    if (!data.slug.trim()) {
      setIsCustomSlug(false)
      setData((prev) => ({
        ...prev,
        slug: formatSlug(prev.title),
      }))
    }
  }

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    setSaving(true)
    try {
      const finalSlug = data.slug.trim() || formatSlug(data.title)
      const payload: Record<string, unknown> = {
        ...data,
        slug: finalSlug,
        image: data.image ?? null,
        content: data.content,
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

  const previewUrl =
    initialPreviewUrl ||
    (marketingSiteUrl && data.slug
      ? `${marketingSiteUrl.replace(/\/$/, '')}/blog/${data.slug}`
      : null)

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
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => {
                  if (!data.slug.trim()) {
                    setIsCustomSlug(false)
                    setData((prev) => ({ ...prev, slug: formatSlug(prev.title) }))
                  }
                }}
                placeholder="Judul artikel"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">
                  Slug
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {isCustomSlug ? 'Manual' : 'Otomatis'}
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleSyncSlug}
                  title="Sinkronkan slug dengan judul"
                >
                  <RefreshCw className="mr-1 size-3" />
                  Sync dari judul
                </Button>
              </div>
              <Input
                id="slug"
                value={data.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
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
              <Label>Gambar Sampul</Label>
              <ImageUpload
                value={data.image}
                initialMedia={typeof post?.image === 'object' ? (post?.image as any) : null}
                onChange={(id) => set('image', id)}
                disabled={!canWrite}
                recommendedText="Rekomendasi rasio 16:9 (1200×630 piksel), maks. 4.5MB"
              />
            </div>
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
