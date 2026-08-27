import 'dotenv/config'
import { runBlogGeneratorWorkflow } from '../src/lib/services/blog-generator'

async function main() {
  console.log('====================================================')
  console.log('🚀 Memulai Generator Blog Vour Studio (Topic Bank) ')
  console.log('====================================================')

  const result = await runBlogGeneratorWorkflow({
    autoPublish: true,
  })

  if (!result.success) {
    console.error(`\n❌ Gagal: ${result.message}`)
    process.exit(1)
  }

  console.log('\n✅ BERHASIL DIGENERATE!')
  console.log('----------------------------------------------------')
  console.log(`Judul      : ${result.article?.title}`)
  console.log(`Slug       : ${result.slug}`)
  console.log(`Kategori   : ${result.article?.category}`)
  console.log(`Estimasi   : ${result.article?.readingMinutes} menit membaca`)
  console.log(`Remote ID  : #${result.topic?.id}`)
  console.log(`Local ID   : #${result.post?.id}`)
  console.log(`URL Render : http://localhost:3000/blog/${result.slug}`)
  console.log('====================================================\n')
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
