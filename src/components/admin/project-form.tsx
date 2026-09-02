'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Project } from '@/payload-types'
import { create, update } from '@/lib/admin-api'
import { formatSlug } from '@/lib/format-slug'
import { ImageUpload } from '@/components/admin/image-upload'
import { ArrayField } from '@/components/admin/array-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-48 items-center justify-center rounded-md border bg-muted/40 text-sm text-muted-foreground">
        Memuat editor...
      </div>
    ),
  }
)

/** A Lexical document with one empty paragraph, the same seed post-form uses. */
const EMPTY_DESCRIPTION = {
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

type ProjectDraft = {
  slug: string
  name: string
  industry: string
  year: string
  /** Lexical editor state; the site renders it with its RichText component. */
  description: any
  technology: { tech: string }[]
  image: number | null
}

export function ProjectForm({ project, canWrite = false }: { project?: Project; canWrite?: boolean }) {
  const router = useRouter()
  const isEdit = Boolean(project)

  const [data, setData] = useState<ProjectDraft>({
    slug: project?.slug ?? '',
    name: project?.name ?? '',
    industry: project?.industry ?? '',
    year: project?.year ?? '',
    description: (project as any)?.description ?? EMPTY_DESCRIPTION,
    technology: project?.technology?.map(({ tech }) => ({ tech })) ?? [{ tech: '' }],
    image: project?.image && typeof project.image !== 'number' ? project.image.id : (project?.image as number | null) ?? null,
  })
  const [isCustomSlug, setIsCustomSlug] = useState(
    Boolean(isEdit && project?.slug && project?.name && project.slug !== formatSlug(project.name))
  )
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const handleNameChange = (name: string) => {
    setData((prev) => ({
      ...prev,
      name,
      slug: !isCustomSlug ? formatSlug(name) : prev.slug,
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
      slug: formatSlug(prev.name),
    }))
  }

  const handleSlugBlur = () => {
    if (!data.slug.trim()) {
      setIsCustomSlug(false)
      setData((prev) => ({
        ...prev,
        slug: formatSlug(prev.name),
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const finalSlug = data.slug.trim() || formatSlug(data.name)
      const payload: Record<string, unknown> = {
        ...data,
        description: data.description ?? EMPTY_DESCRIPTION,
        slug: finalSlug,
        image: data.image ?? null,
        technology: data.technology.map(({ tech }) => ({ tech: tech.trim() })).filter(({ tech }) => Boolean(tech)),
      }
      if (isEdit) {
        await update<Project>('projects', project!.id, payload)
        toast.success('Project berhasil disimpan.')
      } else {
        await create<Project>('projects', payload)
        toast.success('Project berhasil dibuat.')
      }
      router.push('/admin/projects')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/projects')} aria-label="Kembali">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? 'Edit Project' : 'Project Baru'}</h1>
          <p className="text-sm text-muted-foreground">
            Isian di sini tampil apa adanya di kartu halaman Projects vour.dev, tanpa bagian yang disembunyikan.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Project</CardTitle>
            <CardDescription>Nama klien dan industrinya. Tahun juga menentukan urutan kartu, terbaru di atas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => {
                    if (!data.slug.trim()) {
                      setIsCustomSlug(false)
                      setData((prev) => ({ ...prev, slug: formatSlug(prev.name) }))
                    }
                  }}
                  placeholder="Nama project"
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
                    title="Sinkronkan slug dengan nama"
                  >
                    <RefreshCw className="mr-1 size-3" />
                    Sync dari nama
                  </Button>
                </div>
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  onBlur={handleSlugBlur}
                  placeholder="nama-project"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="industry">Industri *</Label>
                <Input
                  id="industry"
                  value={data.industry}
                  onChange={(e) => set('industry', e.target.value)}
                  placeholder="e.g. E-commerce"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Tahun *</Label>
                <Input
                  id="year"
                  value={data.year}
                  onChange={(e) => set('year', e.target.value)}
                  placeholder="2025"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi *</Label>
              <RichTextEditor
                value={data.description}
                onChange={(description) => set('description', description)}
              />
              <p className="text-xs text-muted-foreground">
                Satu-satunya teks yang tampil di kartu selain nama klien. Tulis perubahannya dari
                sisi klien, bukan teknologinya. Tebal, tautan, dan daftar poin ikut terbawa ke
                situs; dua sampai empat baris paling enak dibaca di kartu.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Gambar Project</Label>
              <ImageUpload
                value={data.image}
                initialMedia={typeof project?.image === 'object' ? (project?.image as any) : null}
                onChange={(id) => set('image', id)}
                disabled={!canWrite}
                recommendedText="Dipotong ke rasio 16:10 di situs. Rekomendasi 1600×1000 piksel, maks. 4.5MB"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teknologi</CardTitle>
            <CardDescription>Tampil sebagai label kecil di dasar kartu. Tiga sampai lima paling terbaca.</CardDescription>
          </CardHeader>
          <CardContent>
            <ArrayField
              label="Teknologi"
              items={data.technology}
              field="tech"
              onChange={(items) =>
                set('technology', items.map(({ tech }) => ({ tech: String(tech ?? '') })))
              }
              placeholder="Satu teknologi per baris"
              addLabel="Tambah teknologi"
              max={12}
            />
          </CardContent>
        </Card>

        {canWrite ? (
          <div className="flex justify-end gap-2 pb-8">
            <Button variant="outline" onClick={() => router.push('/admin/projects')} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Simpan Perubahan' : 'Buat Project'}
            </Button>
          </div>
        ) : (
          <p className="pb-8 text-sm text-muted-foreground">
            Anda hanya memiliki akses baca untuk koleksi ini.
          </p>
        )}
      </div>
    </div>
  )
}
