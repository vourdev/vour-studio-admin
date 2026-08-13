'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Product } from '@/payload-types'
import { create, update } from '@/lib/admin-api'
import { MediaPicker } from '@/components/admin/media-picker'
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
    category: product?.category ?? 'Template',
    tagline: product?.tagline ?? '',
    features: product?.features?.map(({ feature }) => ({ feature })) ?? [{ feature: '' }],
    price: product?.price ?? null,
    status: product?.status ?? 'soon',
    image: product?.image && typeof product.image !== 'number' ? product.image.id : (product?.image as number | null) ?? null,
  })
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const slugify = (val: string) =>
    val
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
      .toLowerCase()

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        ...data,
        image: data.image ?? null,
        features: data.features.map(({ feature }) => ({ feature })),
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
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Nama produk"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Kosongkan untuk otomatis.
                  </span>
                </Label>
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  onBlur={() => {
                    if (!data.slug && data.name) set('slug', slugify(data.name))
                  }}
                  placeholder="nama-produk"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
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
                <Label htmlFor="status">Status *</Label>
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
              <Label>Gambar produk</Label>
              <p className="text-xs text-muted-foreground">
                Rekomendasi: 1280×720 piksel (rasio 16:9) agar pas dengan card di halaman produk digital.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <MediaPicker
                  value={data.image}
                  onChange={(id) => set('image', id)}
                  triggerLabel={data.image ? 'Ganti gambar' : 'Pilih gambar'}
                />
                {data.image ? (
                  <span className="text-sm text-muted-foreground">ID media: {data.image}</span>
                ) : null}
              </div>
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
