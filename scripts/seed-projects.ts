import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-off script: seed the placeholder portfolio case studies into the CMS.
 * Mirrors the projects that used to live (and still fall back to) in the
 * marketing site's `lib/data/projects.ts`, so the two stay visually identical
 * until real engagements replace them.
 *
 * Usage: npm run seed:projects
 */

type SeedProject = {
  slug: string
  name: string
  industry: string
  year: string
  result: string
  challenge: string
  solution: string
  technology: string[]
}

const seedProjects: SeedProject[] = [
  {
    slug: 'arunika-living',
    name: 'Arunika Living',
    industry: 'Retail furnitur',
    year: '2025',
    result:
      'Katalog yang dulu dikirim manual lewat chat kini bisa dibuka sendiri oleh calon pembeli, dan tim penjualan tidak lagi mengulang pertanyaan yang sama.',
    challenge:
      'Katalog produk tersebar di beberapa file dan hanya dikirim manual saat ada yang bertanya. Tim penjualan menghabiskan sebagian besar waktu menjawab pertanyaan yang sama.',
    solution:
      'Katalog daring dengan pencarian dan filter, ditambah halaman detail yang bisa langsung dibagikan sebagai tautan tunggal ke calon pembeli.',
    technology: ['Web Application', 'Content Management'],
  },
  {
    slug: 'kirana-logistik',
    name: 'Kirana Logistik',
    industry: 'Logistik',
    year: '2025',
    result:
      'Laporan harian yang sebelumnya disusun manual tiap pagi sekarang sudah siap sebelum tim masuk kerja.',
    challenge:
      'Data pengiriman dicatat di beberapa spreadsheet terpisah. Menyusun laporan harian memakan waktu satu hingga dua jam setiap pagi dan sering berbeda antar cabang.',
    solution:
      'Dashboard internal yang menarik data dari sumber yang sudah dipakai, lalu merangkumnya otomatis setiap malam ke satu tampilan yang sama untuk semua cabang.',
    technology: ['Dashboard', 'AI Automation'],
  },
  {
    slug: 'sembara-coffee',
    name: 'Sembara Coffee',
    industry: 'Food and beverage',
    year: '2024',
    result:
      'Pemesanan grosir masuk lewat satu jalur yang tercatat rapi, menggantikan pesanan yang sebelumnya tercecer di beberapa aplikasi chat.',
    challenge:
      'Pesanan grosir datang dari berbagai kanal dan sering terlewat. Tidak ada catatan tunggal yang bisa dicek ulang saat terjadi selisih.',
    solution:
      'Halaman pemesanan dengan konfirmasi otomatis, plus notifikasi internal setiap kali pesanan baru masuk sehingga tidak ada yang menunggu tanpa jawaban.',
    technology: ['Web Application', 'Automation'],
  },
]

async function seedProjectsCommand() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const project of seedProjects) {
    const existing = await payload.find({
      collection: 'projects',
      where: { slug: { equals: project.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`Project ${project.slug} sudah ada. Melewatkan.`)
      skipped++
      continue
    }

    await payload.create({
      collection: 'projects',
      data: {
        slug: project.slug,
        name: project.name,
        industry: project.industry,
        year: project.year,
        result: project.result,
        challenge: project.challenge,
        solution: project.solution,
        technology: project.technology.map((tech) => ({ tech })),
      },
    })
    console.log(`Project dibuat: ${project.slug}`)
    created++
  }

  console.log(`Selesai. ${created} dibuat, ${skipped} dilewati.`)
  process.exit(0)
}

seedProjectsCommand().catch((error) => {
  console.error(error)
  process.exit(1)
})
