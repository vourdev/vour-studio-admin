import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-off script: seed the placeholder digital products into the CMS.
 * Mirrors the products that used to live (and still fall back to) in the
 * marketing site's `lib/data/products.ts`, so the two stay visually identical
 * until real products replace them.
 *
 * Usage: npm run seed:products
 */

type SeedProduct = {
  slug: string
  name: string
  category: 'Template' | 'Starter Kit' | 'Toolkit'
  tagline: string
  features: string[]
  price?: number
  status: 'available' | 'soon'
}

const seedProducts: SeedProduct[] = [
  {
    slug: 'portfolio-template',
    name: 'Portfolio Template',
    category: 'Template',
    tagline:
      'Portfolio siap pakai untuk developer dan desainer yang ingin tampil rapi tanpa membangun dari nol.',
    features: [
      'Halaman project dengan studi kasus',
      'Mode gelap dan terang',
      'Siap ditemukan mesin pencari',
    ],
    status: 'soon',
  },
  {
    slug: 'landing-page-template',
    name: 'Landing Page Template',
    category: 'Template',
    tagline:
      'Landing page yang fokus pada satu tujuan: mengubah pengunjung menjadi calon pelanggan.',
    features: [
      'Section yang bisa disusun ulang',
      'Form kontak yang sudah terhubung',
      'Animasi yang bisa dimatikan',
    ],
    status: 'soon',
  },
  {
    slug: 'dashboard-template',
    name: 'Dashboard Template',
    category: 'Template',
    tagline:
      'Panel internal dengan tabel, filter, dan grafik yang sudah tertata sejak awal.',
    features: [
      'Tabel dengan pencarian dan filter',
      'Grafik yang terbaca di dua mode warna',
      'Struktur peran pengguna',
    ],
    status: 'soon',
  },
  {
    slug: 'starter-kit',
    name: 'Developer Starter Kit',
    category: 'Starter Kit',
    tagline:
      'Fondasi project yang sudah dipasang dan diuji, supaya Anda mulai dari fitur, bukan dari konfigurasi.',
    features: [
      'Struktur folder yang konsisten',
      'Pengaturan kualitas kode',
      'Dokumentasi cara merilis',
    ],
    status: 'soon',
  },
]

async function seedProductsCommand() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const product of seedProducts) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`Produk ${product.slug} sudah ada. Melewatkan.`)
      skipped++
      continue
    }

    await payload.create({
      collection: 'products',
      data: {
        slug: product.slug,
        name: product.name,
        category: product.category,
        tagline: product.tagline,
        features: product.features.map((feature) => ({ feature })),
        status: product.status,
        // price intentionally omitted: null while pricing is undecided.
      },
    })
    console.log(`Produk dibuat: ${product.slug}`)
    created++
  }

  console.log(`Selesai. ${created} dibuat, ${skipped} dilewati.`)
  process.exit(0)
}

seedProductsCommand().catch((error) => {
  console.error(error)
  process.exit(1)
})
