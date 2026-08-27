import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { runBlogGeneratorWorkflow } from '@/lib/services/blog-generator'

describe('Blog Generator Integration', () => {
  it('successfully generates and stores blog post from topic into postgres posts table', async () => {
    const testTopic = {
      id: `test-topic-${Date.now()}`,
      title: 'Membangun Arsitektur Scalable dengan Next.js 16',
      brief: 'Panduan mendalam mengenai App Router, caching strategy, dan serverless Postgres untuk performa maksimal.',
      category: 'Tutorial',
      pillar: 'Web Architecture',
      target_audience: 'Software Engineers & Tech Leads',
      key_takeaways: [
        'Pentingnya Partial Prerendering',
        'Strategi database connection pooling di serverless',
        'Optimasi Core Web Vitals',
      ],
      tags: ['Next.js', 'PostgreSQL', 'Architecture'],
    }

    const result = await runBlogGeneratorWorkflow({
      autoPublish: true,
      specificTopic: testTopic,
    })

    expect(result.success).toBe(true)
    expect(result.slug).toBeDefined()
    expect(result.post).toBeDefined()

    // Verify stored post in central `posts` table in Postgres (Neon)
    const [fetched] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, result.post.id))
      .limit(1)

    expect(fetched).toBeDefined()
    expect(fetched.title).toBe(result.article?.title)
    expect(fetched.slug).toBe(result.slug)
    expect(fetched.content).toBeDefined()
    expect(fetched.status).toBe('published')
  })
})
