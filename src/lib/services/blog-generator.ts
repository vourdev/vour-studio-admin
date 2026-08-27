import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { blogPosts } from '@/db/schema'
import { fetchNextTopicForBlog, updateTopicBlogStatus, type CarouselTopic } from './carousel-backend'
import { generateBlogArticle, type GeneratedBlogArticle } from './omniroute'
import { revalidateSite } from '@/hooks/revalidate-site'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

async function generateUniqueSlug(baseTitle: string): Promise<string> {
  const baseSlug = slugify(baseTitle) || 'blog-post'
  let slug = baseSlug
  let counter = 1

  while (true) {
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1)

    if (!existing) {
      return slug
    }

    counter++
    slug = `${baseSlug}-${counter}`
  }
}

export interface BlogGeneratorResult {
  success: boolean
  message: string
  topic?: CarouselTopic | null
  article?: GeneratedBlogArticle | null
  post?: any
  slug?: string
}

/**
 * TASK 4 & Orchestration: Run full blog generation workflow.
 */
export async function runBlogGeneratorWorkflow(options: {
  autoPublish?: boolean
  specificTopic?: CarouselTopic
} = {}): Promise<BlogGeneratorResult> {
  const autoPublish = options.autoPublish ?? true

  try {
    // 1. Fetch next available topic
    let topic: CarouselTopic | null = options.specificTopic || null
    if (!topic) {
      topic = await fetchNextTopicForBlog()
    }

    if (!topic) {
      return {
        success: false,
        message: 'Tidak ada topik baru yang siap digenerate dari Topic Bank.',
      }
    }

    console.log(`[blog-generator] Memproses topik: "${topic.title}" (ID: ${topic.id})`)

    // 2. Generate long-form article via Omniroute LLM
    const article = await generateBlogArticle(topic)

    // 3. Generate unique slug
    const slug = await generateUniqueSlug(article.title || topic.title)

    // 4. Save to Postgres (vour.dev blog_posts)
    const status = autoPublish ? 'published' : 'draft'
    const publishedAt = autoPublish ? new Date() : null

    const [savedPost] = await db
      .insert(blogPosts)
      .values({
        remoteTopicId: String(topic.id),
        title: article.title,
        slug,
        content: article.content,
        category: article.category,
        readingMinutes: String(article.readingMinutes),
        status,
        publishedAt,
      })
      .returning()

    console.log(`[blog-generator] Artikel tersimpan di Postgres dengan ID #${savedPost.id}, Slug: /blog/${slug}`)

    // 5. Update status back to Carousel Backend Topic Bank
    const updateResult = await updateTopicBlogStatus(topic.id, 'published', {
      slug,
      blogPostId: savedPost.id,
    })

    if (updateResult.success) {
      console.log(`[blog-generator] Status topik #${topic.id} di Carousel Backend berhasil di-update.`)
    }

    // 6. Trigger marketing site revalidation
    await revalidateSite()

    return {
      success: true,
      message: `Artikel "${article.title}" berhasil digenerate dan dipublikasikan.`,
      topic,
      article,
      post: savedPost,
      slug,
    }
  } catch (error) {
    console.error('[blog-generator] Gagal menjalankan workflow generator blog:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat generate blog.',
    }
  }
}
