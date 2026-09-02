'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Product } from '@/payload-types'
import { create, update } from '@/lib/admin-api'
import { formatSlug } from '@/lib/format-slug'
import { ImageUpload } from '@/components/admin/image-upload'
import { PriceInput } from '@/components/admin/price-input'
import { ArrayField } from '@/components/admin/array-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type ProductDraft = {
  slug: string
  name: string
  category: 'Template' | 'Starter Kit' | 'Toolkit'
  tagline: string
  features: { feature: string }[]
  price: number | null
  status: 'available' | 'soon'
  image: number | null
}

export function ProductForm({ product, canWrite = false }: { product?: Product; canWrite?: boolean }) {
  const router = useRouter()
  const isEdit = Boolean(product)

  const [data, setData] = useState<ProductDraft>({
    slug: product?.slug ?? '',
    name: product?.name ?? '',
    category: (product?.category as ProductDraft['category']) ?? 'Template',
    tagline: product?.tagline ?? '',
    features: product?.features?.map(({ feature }) => ({ feature })) ?? [{ feature: '' }],
    price: product?.price ?? null,
    status: product?.status ?? 'soon',
    image: product?.image && typeof product.image !== 'number' ? product.image.id : (product?.image as number | null) ?? null,
  })
  const [isCustomSlug, setIsCustomSlug] = useState(
    Boolean(isEdit && product?.slug && product?.name && product.slug !== formatSlug(product.name))
  )
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
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
        features: data.features.map(({ feature }) => ({ feature: feature.trim() })).filter(({ feature }) => Boolean(feature)),
      }
      if (isEdit) {
        await update<Product>('products', product!.id, payload)
        toast.success('Produk berhasil disimpan.')
      } else {
        await create<Product>('products', payload)
        toast.success('Produk berhasil dibuat.')
      }
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan produk.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/products')} aria-label="Kembali">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? 'Edit Produk' : 'Produk Baru'}</h1>
          <p className="text-sm text-muted-foreground">Template, starter kit, dan toolkit.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Produk</CardTitle>
            <CardDescription>Detail utama produk digital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex h-6 items-center">
                  <Label htmlFor="name">Nama *</Label>
                </div>
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
                  placeholder="Nama produk"
                />
              </div>
              <div className="space-y-2">
                <div className="flex h-6 items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="slug">Slug</Label>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({isCustomSlug ? 'Manual' : 'Otomatis'})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground -mr-1"
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
                  placeholder="nama-produk"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex h-6 items-center">
                  <Label htmlFor="category">Kategori *</Label>
                </div>
                <Select value={data.category} onValueChange={(v) => set('category', v as ProductDraft['category'])}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Template', 'Starter Kit', 'Toolkit'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex h-6 items-center">
                  <Label htmlFor="status">Status *</Label>
                </div>
                <Select value={data.status} onValueChange={(v) => set('status', v as ProductDraft['status'])}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="soon">Segera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline *</Label>
              <Textarea
                id="tagline"
                value={data.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Deskripsi singkat"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Harga</Label>
              <PriceInput
                id="price"
                value={data.price}
                onChange={(value) => set('price', value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan bila belum ditentukan.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Gambar Produk</Label>
              <ImageUpload
                value={data.image}
                initialMedia={typeof product?.image === 'object' ? (product?.image as any) : null}
                onChange={(id) => set('image', id)}
                disabled={!canWrite}
                recommendedText="Dipotong ke 16:10 di kartu dan lebih lebar lagi di grid produk. Rekomendasi 1600×1000 piksel, isi penting di tengah atas, maks. 4.5MB"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fitur</CardTitle>
            <CardDescription>Daftar fitur yang ditampilkan di halaman produk.</CardDescription>
          </CardHeader>
          <CardContent>
            <ArrayField
              label="Fitur"
              items={data.features}
              field="feature"
              onChange={(items) =>
                set('features', items.map(({ feature }) => ({ feature: String(feature ?? '') })))
              }
              placeholder="Satu fitur per baris"
              addLabel="Tambah fitur"
              max={12}
            />
          </CardContent>
        </Card>

        {canWrite ? (
          <div className="flex justify-end gap-2 pb-8">
            <Button variant="outline" onClick={() => router.push('/admin/products')} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Simpan Perubahan' : 'Buat Produk'}
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
