'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AlertTriangle, ArrowLeft, BookOpen, CloudUpload, ExternalLink, Loader2, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/status-badge'

import type { Post } from '@/payload-types'
import { create, update, find } from '@/lib/admin-api'
import { useAutosaveDraft } from '@/hooks/use-autosave-draft'
import { DraftRestoreBanner } from '@/components/admin/draft-restore-banner'
// The Lexical editor is a large client bundle — load it lazily (client-only)
// so the rest of the form paints and is usable first.
import type { RichTextValue } from '@/components/admin/rich-text-editor'
import { MediaPicker } from '@/components/admin/media-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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

export type RelatedPostItem = {
  id: number
  title: string
  slug?: string
  category?: string
  status?: string
  _status?: string
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
  related: RelatedPostItem[]
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

  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoadingPosts(true)
    find<Post>('posts', { limit: 100, sort: '-date' })
      .then((res) => {
        if (mounted && res?.docs) {
          setAllPosts(res.docs)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingPosts(false)
      })
    return () => {
      mounted = false
    }
  }, [])

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
    related:
      post?.related
        ?.map((item) => ({
          id: Number(item.id || item.relatedPostId || 0),
          title: item.title || item.label || '',
          slug: item.slug || '',
          category: item.category || undefined,
          status: item.status || item._status || undefined,
          _status: item._status || item.status || undefined,
        }))
        .filter((item) => item.id > 0) ?? [],
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

  const handleAddRelated = (selectedIdStr: string) => {
    if (!selectedIdStr) return
    const id = Number(selectedIdStr)
    const found = allPosts.find((p) => p.id === id)
    if (found && data.related.length < 5) {
      set('related', [
        ...data.related,
        {
          id: found.id,
          title: found.title || `Artikel #${found.id}`,
          slug: found.slug || '',
          category: found.category || undefined,
          status: found._status || undefined,
          _status: found._status || undefined,
        },
      ])
    }
  }

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        ...data,
        image: data.image ?? null,
        content: data.content,
        related:
          data.related.map((row) => ({
            id: row.id,
            relatedPostId: row.id,
            title: row.title,
            slug: row.slug,
            category: row.category,
          })) || null,
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  Artikel Terkait
                </CardTitle>
                <CardDescription>
                  Pilih artikel dalam kategori yang sama (<strong>{data.category}</strong>) untuk direferensikan sebagai bacaan terkait.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {data.related.length} / 5 dipilih
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.related.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Belum ada artikel terkait yang dipilih.
              </div>
            ) : (
              <div className="space-y-2">
                {data.related.map((row, i) => (
                  <div
                    key={row.id || i}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-primary/40"
                  >
                    <div className="flex flex-1 items-center gap-3 overflow-hidden">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-none">
                          {row.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {row.category ? (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {row.category}
                            </Badge>
                          ) : null}
                          {row.status || row._status ? (
                            <StatusBadge status={(row.status || row._status || 'published') as any} />
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => set('related', data.related.filter((_, j) => j !== i))}
                      aria-label="Hapus artikel terkait"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {data.related.length < 5 && (
              <div className="pt-1">
                {loadingPosts ? (
                  <p className="text-xs text-muted-foreground">Memuat daftar artikel…</p>
                ) : allPosts.filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id)).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Tidak ada artikel lain yang tersedia untuk dipilih.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Select onValueChange={handleAddRelated} value="">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="+ Tambah artikel terkait..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allPosts
                          .filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id) && p.category === data.category)
                          .length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Kategori Sama ({data.category})
                            </div>
                            {allPosts
                              .filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id) && p.category === data.category)
                              .map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.title}
                                </SelectItem>
                              ))}
                          </>
                        )}
                        {allPosts
                          .filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id) && p.category !== data.category)
                          .length > 0 && (
                          <>
                            <div className="mt-1 border-t px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Kategori Lain
                            </div>
                            {allPosts
                              .filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id) && p.category !== data.category)
                              .map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  [{p.category}] {p.title}
                                </SelectItem>
                              ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {allPosts.filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id) && p.category === data.category).length === 0 &&
                      allPosts.filter((p) => p.id !== post?.id && !data.related.some((r) => r.id === p.id) && p.category !== data.category).length > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Belum ada artikel lain dalam kategori <strong>{data.category}</strong>. Anda dapat memilih dari kategori lain atau membuat artikel baru terlebih dahulu.
                        </p>
                      )}
                  </div>
                )}
              </div>
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
