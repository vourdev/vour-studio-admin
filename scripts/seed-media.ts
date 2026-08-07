import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import sharp from 'sharp'

/**
 * One-off script: replace Picsum placeholders with real (generated) images in
 * the Media collection and attach them to the seeded products and projects.
 *
 * Each image is a branded placeholder — dark surface, subtle grid, the Vour
 * accent — so the marketing site renders local CMS media instead of
 * external Picsum URLs. Swap them for real screenshots later via the admin
 * panel; this just exercises the full media pipeline end to end.
 *
 * Usage: npm run seed:media
 */

const ACCENT = '#39d5f6'

type Item = {
  kind: 'products' | 'projects'
  slug: string
  name: string
  alt: string
  width: number
  height: number
}

const items: Item[] = [
  // Products: 800x600-ish source (card size 768x576 is generated on upload).
  { kind: 'products', slug: 'portfolio-template', name: 'Portfolio Template', alt: 'Pratinjau Portfolio Template Vour', width: 1200, height: 800 },
  { kind: 'products', slug: 'landing-page-template', name: 'Landing Page Template', alt: 'Pratinjau Landing Page Template Vour', width: 1200, height: 800 },
  { kind: 'products', slug: 'dashboard-template', name: 'Dashboard Template', alt: 'Pratinjau Dashboard Template Vour', width: 1200, height: 800 },
  { kind: 'products', slug: 'starter-kit', name: 'Developer Starter Kit', alt: 'Pratinjau Developer Starter Kit Vour', width: 1200, height: 800 },
  // Projects: larger display sizes.
  { kind: 'projects', slug: 'arunika-living', name: 'Arunika Living', alt: 'Studi kasus Arunika Living', width: 1600, height: 1067 },
  { kind: 'projects', slug: 'kirana-logistik', name: 'Kirana Logistik', alt: 'Studi kasus Kirana Logistik', width: 1600, height: 1067 },
  { kind: 'projects', slug: 'sembara-coffee', name: 'Sembara Coffee', alt: 'Studi kasus Sembara Coffee', width: 1600, height: 1067 },
]

function brandSvg(name: string, width: number, height: number): string {
  const grid = Array.from({ length: Math.floor(width / 96) }, (_, i) => {
    const x = (i + 1) * 96
    return `<line x1="${x}" y1="0" x2="${x}" y2="${height}" />`
  })
    .concat(
      Array.from({ length: Math.floor(height / 96) }, (_, i) => {
        const y = (i + 1) * 96
        return `<line x1="0" y1="${y}" x2="${width}" y2="${y}" />`
      }),
    )
    .join('')

  const label = name.length > 22 ? 'VOUR' : 'VOUR STUDIO'

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0f0f11"/>
  <g stroke="#ffffff14" stroke-width="1">${grid}</g>
  <rect x="0" y="0" width="6" height="100%" fill="${ACCENT}"/>
  <text x="80" y="72" fill="#71717a" font-family="ui-monospace, monospace" font-size="22" letter-spacing="2">${label} / ${name.includes('Template') ? 'TEMPLATE' : 'CASE STUDY'}</text>
  <text x="80" y="${height / 2 + 12}" fill="#ffffff" font-family="ui-monospace, monospace" font-size="${name.length > 22 ? 40 : 52}" font-weight="600">${name}</text>
  <rect x="80" y="${height / 2 + 40}" width="96" height="6" fill="${ACCENT}"/>
  <text x="${width - 80}" y="${height - 48}" fill="#52525b" font-family="ui-monospace, monospace" font-size="20" text-anchor="end">vour.studio</text>
</svg>`
}

async function generatePng(name: string, width: number, height: number): Promise<Buffer> {
  return sharp(Buffer.from(brandSvg(name, width, height))).png().toBuffer()
}

async function seedMediaCommand() {
  const payload = await getPayload({ config })

  // Report admin users (and create a dev one only if none exist yet).
  const users = await payload.find({ collection: 'users', limit: 20 })
  if (users.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'dev@vour.local',
        password: 'vour-dev-password',
        name: 'Vour Dev Admin',
        roles: ['admin'],
      },
    })
    console.log('Belum ada user admin. Dibuat: dev@vour.local / vour-dev-password (ganti setelah dipakai).')
  } else {
    for (const u of users.docs) {
      console.log(`User admin: ${u.email} (roles: ${u.roles?.join(', ') ?? 'none'})`)
    }
  }

  let uploaded = 0
  let attached = 0

  for (const item of items) {
    const buffer = await generatePng(item.name, item.width, item.height)
    const filename = `${item.slug}.png`

    // Skip if media for this slug already exists.
    const existingMedia = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    const mediaDoc =
      existingMedia.docs[0] ??
      (await payload.create({
        collection: 'media',
        data: { alt: item.alt },
        file: {
          data: buffer,
          mimetype: 'image/png',
          name: filename,
          size: buffer.length,
        },
      }))

    const collection = item.kind
    const existing = await payload.find({
      collection,
      where: { slug: { equals: item.slug } },
      limit: 1,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection,
        id: existing.docs[0].id,
        data: { image: mediaDoc.id },
      })
      console.log(`Attach ${item.kind}/${item.slug} -> media ${mediaDoc.id} (${filename})`)
      attached++
    } else {
      console.log(`SKIP ${item.kind}/${item.slug}: dokumen tidak ditemukan.`)
    }
    uploaded++
  }

  console.log(`Selesai. ${uploaded} gambar, ${attached} terlampir.`)
  process.exit(0)
}

seedMediaCommand().catch((error) => {
  console.error(error)
  process.exit(1)
})
