import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-off script: migrate the marketing site's MDX article into the CMS as a
 * published post. The content is built as Lexical JSON with the small helpers
 * below (the same node shapes Payload's richText field stores), so no
 * markdown/DOM conversion is needed.
 *
 * Usage: npm run seed:posts
 */

// --- Lexical node builders -------------------------------------------------
type LexNode = Record<string, unknown>

const text = (value: string, format = 0): LexNode => ({
  type: 'text',
  text: value,
  format,
  style: '',
  detail: 0,
  mode: 'normal',
  version: 1,
})

const paragraph = (...children: LexNode[]): LexNode => ({
  type: 'paragraph',
  version: 1,
  textFormat: 0,
  textStyle: '',
  direction: null,
  indent: 0,
  children,
})

const heading = (tag: 'h2' | 'h3', ...children: LexNode[]): LexNode => ({
  type: 'heading',
  version: 1,
  tag,
  textFormat: 0,
  textStyle: '',
  direction: null,
  indent: 0,
  children,
})

const link = (url: string, ...children: LexNode[]): LexNode => ({
  type: 'link',
  version: 1,
  fields: { url, newTab: false },
  direction: null,
  format: '',
  indent: 0,
  children,
})

const list = (listType: 'bullet' | 'number', tag: 'ul' | 'ol', items: LexNode[]): LexNode => ({
  type: 'list',
  version: 1,
  listType,
  start: 1,
  tag,
  direction: null,
  indent: 0,
  children: items,
})

const listItem = (value: number, ...children: LexNode[]): LexNode => ({
  type: 'listitem',
  version: 1,
  value,
  checked: false,
  children,
})

const root = (...children: LexNode[]) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children,
  },
})

// Text format flags: 0 normal, 1 bold, 2 italic, 16 inline code.
const BOLD = 1

// --- Article content (mirrors content/resources/memilih-...mdx) -------------
const content = root(
  paragraph(
    text('Pertanyaan yang paling sering kami terima di sesi konsultasi awal bukan soal harga atau lama pengerjaan. Pertanyaannya lebih mendasar: sebenarnya yang dibutuhkan ini website atau dashboard?'),
  ),
  paragraph(
    text('Keduanya sama-sama dibuka lewat browser dan sama-sama bisa terlihat modern. Tapi keduanya menyelesaikan masalah yang sama sekali berbeda, dan memesan yang salah berarti membayar untuk sesuatu yang tidak akan menyelesaikan masalah Anda.'),
  ),
  heading('h2', text('Bedanya ada pada siapa yang membukanya')),
  paragraph(
    text('Cara tercepat memisahkan keduanya adalah dengan bertanya: siapa yang akan membukanya setiap hari?'),
  ),
  paragraph(
    text('Website', BOLD),
    text(' dibuka oleh orang yang belum mengenal Anda. Tugasnya menjelaskan, meyakinkan, dan mengarahkan ke satu tindakan. Ukuran keberhasilannya adalah berapa banyak pengunjung yang akhirnya menghubungi Anda.'),
  ),
  paragraph(
    text('Dashboard', BOLD),
    text(' dibuka oleh orang yang sudah bekerja bersama Anda, biasanya tim internal. Tugasnya menampilkan keadaan terkini dan memudahkan pengambilan keputusan. Ukuran keberhasilannya adalah berapa banyak waktu yang dihemat.'),
  ),
  paragraph(
    text('Kalau Anda menjawab "keduanya", itu wajar. Tapi hampir selalu ada satu yang lebih mendesak, dan itu yang sebaiknya dikerjakan lebih dulu.'),
  ),
  heading('h2', text('Tiga pertanyaan untuk menentukan urutan')),
  list(
    'number',
    'ol',
    [
      listItem(
        1,
        text('Apa yang sedang menghambat pemasukan?', BOLD),
        text(' Kalau calon pelanggan kesulitan menemukan atau memahami apa yang Anda jual, website dulu. Kalau pesanan sudah masuk tapi tim kewalahan memprosesnya, dashboard dulu.'),
      ),
      listItem(
        2,
        text('Berapa banyak pekerjaan manual yang berulang setiap minggu?', BOLD),
        text(' Kalau ada pekerjaan yang sama persis dilakukan berulang kali, itu tanda paling jelas bahwa yang Anda butuhkan adalah sistem internal, bukan halaman promosi.'),
      ),
      listItem(
        3,
        text('Data Anda sekarang ada di mana?', BOLD),
        text(' Kalau semuanya masih di beberapa spreadsheet terpisah, dashboard akan memberi dampak lebih cepat daripada halaman baru yang cantik.'),
      ),
    ],
  ),
  heading('h2', text('Kesalahan yang paling mahal')),
  paragraph(
    text('Kesalahan yang paling sering kami temui bukan memilih yang salah, melainkan mengerjakan keduanya sekaligus di awal dengan anggaran untuk satu.'),
  ),
  paragraph(
    text('Hasilnya dua produk setengah jadi. Website-nya belum cukup meyakinkan untuk mendatangkan pelanggan baru, dashboard-nya belum cukup lengkap untuk dipercaya tim. Keduanya lalu ditinggalkan.'),
  ),
  paragraph(
    text('Lebih baik menyelesaikan satu sampai benar-benar dipakai, lalu menambah yang kedua di atas fondasi yang sudah terbukti jalan.'),
  ),
  heading('h2', text('Kalau ternyata jawabannya otomasi')),
  paragraph(
    text('Ada kasus ketiga yang sering terlewat. Kadang yang dibutuhkan bukan tampilan baru sama sekali, melainkan penghubung antara alat-alat yang sudah Anda pakai.'),
  ),
  paragraph(
    text('Kalau tim Anda menghabiskan waktu memindahkan data dari satu aplikasi ke aplikasi lain secara manual, membuat dashboard baru hanya menambah satu tempat lagi untuk dibuka. Yang lebih menyelesaikan masalah adalah '),
    link('/solutions#ai-automation', text('otomasi alur kerjanya')),
    text(', sehingga datanya berpindah sendiri.'),
  ),
  heading('h2', text('Langkah berikutnya')),
  paragraph(
    text('Kalau Anda masih ragu setelah membaca ini, jawabannya biasanya ketahuan dalam percakapan lima belas menit. Kami tidak menagih untuk sesi itu, dan hasilnya bukan penawaran, melainkan urutan pengerjaan yang masuk akal untuk keadaan Anda sekarang.'),
  ),
  paragraph(
    link('/contact', text('Diskusikan kebutuhan project Anda')),
    text(' atau lihat dulu '),
    link('/solutions', text('apa saja yang kami tangani')),
    text('.'),
  ),
)

const seedPosts = [
  {
    slug: 'memilih-antara-website-dan-dashboard',
    title: 'Website atau dashboard? Cara memutuskan yang Anda butuhkan lebih dulu',
    description:
      'Banyak bisnis memesan yang salah karena keduanya terlihat mirip. Ini cara memisahkannya dalam beberapa pertanyaan sederhana.',
    category: 'Dev Notes',
    date: '2026-07-14T00:00:00.000Z',
    readingMinutes: 6,
    content,
    related: [
      { label: 'Website Development', href: '/solutions#website-development' },
      { label: 'AI Automation', href: '/solutions#ai-automation' },
      { label: 'Dashboard Template', href: '/products' },
    ],
  },
]

async function seedPostsCommand() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const post of seedPosts) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`Post ${post.slug} sudah ada. Melewatkan.`)
      skipped++
      continue
    }

    await payload.create({
      collection: 'posts',
      data: {
        ...post,
        // Publish immediately so the public API returns it.
        _status: 'published',
      },
    })
    console.log(`Post dibuat: ${post.slug}`)
    created++
  }

  console.log(`Selesai. ${created} dibuat, ${skipped} dilewati.`)
  process.exit(0)
}

seedPostsCommand().catch((error) => {
  console.error(error)
  process.exit(1)
})
