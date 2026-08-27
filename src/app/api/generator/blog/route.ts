import { NextRequest, NextResponse } from 'next/server'
import { runBlogGeneratorWorkflow } from '@/lib/services/blog-generator'
import { getCurrentUser } from '@/lib/get-current-user'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { desc } from 'drizzle-orm'

function isAuthorized(request: NextRequest, user: any): boolean {
  if (user) return true

  const authHeader = request.headers.get('authorization')
  const serviceKey = process.env.VOURDEV_SERVICE_KEY || '3u820qD0ZIPTI6dRDmmvQ3hWh8jNLa5W7slDkp/oBhs='
  if (authHeader && serviceKey && authHeader === `Bearer ${serviceKey}`) {
    return true
  }

  // Also check x-service-key or x-api-key
  const apiKey = request.headers.get('x-service-key') || request.headers.get('x-api-key')
  if (apiKey && apiKey === serviceKey) {
    return true
  }

  return false
}

/**
 * GET /api/generator/blog
 * Mengambil daftar artikel blog terbaru dari tabel posts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!isAuthorized(request, user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))

    const list = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        category: posts.category,
        status: posts.status,
        date: posts.date,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)

    return NextResponse.json({
      success: true,
      total: list.length,
      docs: list,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/generator/blog
 * Menerima trigger pembuatan artikel blog (baik direct payload dari n8n maupun internal Topic Bank)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!isAuthorized(request, user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {}

    const autoPublish = body.autoPublish ?? true

    // Check if n8n passes direct article content (from Node 4 / Omniroute)
    let specificArticle = undefined
    let specificTopic = body.topic ?? undefined

    if (body.content || (body.title && body.description)) {
      specificArticle = {
        title: body.title,
        content: body.content,
        description: body.description,
        category: body.category,
        readingMinutes: Number(body.readingMinutes) || 5,
      }

      if (!specificTopic && body.topicId) {
        specificTopic = {
          id: body.topicId,
          title: body.title,
          category: body.category,
        }
      }
    }

    const result = await runBlogGeneratorWorkflow({
      autoPublish,
      specificTopic,
      specificArticle,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mengeksekusi blog generator.',
      },
      { status: 500 }
    )
  }
}
