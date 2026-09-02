'use client'

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
import { Textarea } from '@/components/ui/textarea'

type ProjectDraft = {
  slug: string
  name: string
  industry: string
  year: string
  result: string
  challenge: string
  solution: string
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
    result: project?.result ?? '',
    challenge: project?.challenge ?? '',
    solution: project?.solution ?? '',
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
          <p className="text-sm text-muted-foreground">Studi kasus portfolio.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Project</CardTitle>
            <CardDescription>Detail studi kasus.</CardDescription>
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
              <Label htmlFor="result">Hasil *</Label>
              <Textarea
                id="result"
                value={data.result}
                onChange={(e) => set('result', e.target.value)}
                placeholder="Headline hasil yang didapat klien"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenge">Tantangan *</Label>
              <Textarea
                id="challenge"
                value={data.challenge}
                onChange={(e) => set('challenge', e.target.value)}
                placeholder="Tantangan project"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution">Solusi *</Label>
              <Textarea
                id="solution"
                value={data.solution}
                onChange={(e) => set('solution', e.target.value)}
                placeholder="Solusi yang diambil"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail Project</Label>
              <ImageUpload
                value={data.image}
                initialMedia={typeof project?.image === 'object' ? (project?.image as any) : null}
                onChange={(id) => set('image', id)}
                disabled={!canWrite}
                recommendedText="Rekomendasi rasio 16:9 (1280×720 piksel), maks. 4.5MB"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teknologi</CardTitle>
            <CardDescription>Teknologi yang dipakai dalam project.</CardDescription>
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
