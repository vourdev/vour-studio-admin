import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts, blogPosts } from '@/db/schema'
import { fetchNextTopicForBlog, updateTopicBlogStatus, type CarouselTopic } from './carousel-backend'
import { generateBlogArticle, type GeneratedBlogArticle } from './omniroute'
import { markdownToLexical } from '@/lib/markdown-to-lexical'
import { normalizeCategory } from '@/lib/normalize-category'
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
    const [existingPost] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1)

    const [existingBlogPost] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1)

    if (!existingPost && !existingBlogPost) {
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
 * Orchestrator: Runs full blog generation workflow.
 * 1. Fetches topic from Carousel Backend (or uses provided topic)
 * 2. Generates article with Omniroute LLM (or uses provided article content)
 * 3. Normalizes category to PostgreSQL enum ('Tutorial' | 'Case Study' | 'Dev Notes')
 * 4. Saves to central `posts` table (Lexical JSON format) & `blog_posts` table (Postgres)
 * 5. Updates status back to Carousel Backend Topic Bank
 * 6. Revalidates marketing site (vour-studio)
 */
export async function runBlogGeneratorWorkflow(options: {
  autoPublish?: boolean
  specificTopic?: CarouselTopic
  specificArticle?: GeneratedBlogArticle
} = {}): Promise<BlogGeneratorResult> {
  const autoPublish = options.autoPublish ?? true

  try {
    // 1. Fetch next available topic if not supplied
    let topic: CarouselTopic | null = options.specificTopic || null
    if (!topic && !options.specificArticle) {
      topic = await fetchNextTopicForBlog()
    }

    if (!topic && !options.specificArticle) {
      return {
        success: false,
        message: 'Tidak ada topik baru yang siap digenerate dari Topic Bank.',
      }
    }

    const topicTitle = topic?.title || options.specificArticle?.title || 'Artikel Blog'
    const topicId = topic?.id || 'manual'

    console.log(`[blog-generator] Memproses artikel/topik: "${topicTitle}" (ID: ${topicId})`)

    // 2. Generate long-form article via Omniroute LLM if not supplied
    let article: GeneratedBlogArticle
    if (options.specificArticle) {
      article = options.specificArticle
    } else if (topic) {
      article = await generateBlogArticle(topic)
    } else {
      throw new Error('Tidak ada data topik maupun artikel.')
    }

    // 3. Generate unique slug
    const slug = await generateUniqueSlug(article.title || topicTitle)

    // 4. Normalize category to match Postgres enum ('Tutorial' | 'Case Study' | 'Dev Notes')
    const safeCategory = normalizeCategory(article.category || topic?.category)

    // 5. Save to central `posts` table (shared with vour-studio and admin dashboard)
    const status = autoPublish ? 'published' : 'draft'
    const publishedAt = autoPublish ? new Date() : null
    const lexicalContent =
      typeof article.content === 'object' && article.content !== null
        ? article.content
        : markdownToLexical(typeof article.content === 'string' ? article.content : '')

    const [savedPost] = await db
      .insert(posts)
      .values({
        title: article.title,
        slug,
        description: article.description || `Panduan mengenai ${article.title}`,
        category: safeCategory,
        date: publishedAt || new Date(),
        readingMinutes: String(article.readingMinutes || 5),
        content: lexicalContent,
        status,
      })
      .returning()

    // Also mirror to `blog_posts` table
    await db
      .insert(blogPosts)
      .values({
        remoteTopicId: String(topicId),
        title: article.title,
        slug,
        content: typeof article.content === 'string' ? article.content : JSON.stringify(article.content),
        category: safeCategory,
        readingMinutes: String(article.readingMinutes || 5),
        status,
        publishedAt,
      })
      .catch((err) => console.warn('[blog-generator] Note: Mirror to blog_posts skipped:', err?.message))

    console.log(`[blog-generator] Artikel tersimpan di tabel posts dengan ID #${savedPost.id}, Slug: ${slug}, Category: ${safeCategory}`)

    // 6. Update status back to Carousel Backend Topic Bank if topicId is valid
    if (topic && topic.id && topic.id !== 'manual') {
      const updateResult = await updateTopicBlogStatus(topic.id, 'published', {
        slug,
        blogPostId: savedPost.id,
      })

      if (updateResult.success) {
        console.log(`[blog-generator] Status topik #${topic.id} di Carousel Backend berhasil di-update.`)
      }
    }

    // 7. Trigger marketing site (vour-studio) revalidation
    await revalidateSite()

    return {
      success: true,
      message: `Artikel "${article.title}" berhasil disimpan dan dipublikasikan ke ekosistem Vour.`,
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
