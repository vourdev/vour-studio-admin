import { NextRequest, NextResponse } from 'next/server'
import { runBlogGeneratorWorkflow } from '@/lib/services/blog-generator'
import { getCurrentUser } from '@/lib/get-current-user'
import { db } from '@/db'
import { blogPosts } from '@/db/schema'
import { desc } from 'drizzle-orm'

function isAuthorized(request: NextRequest, user: any): boolean {
  if (user) return true

  const authHeader = request.headers.get('authorization')
  const serviceKey = process.env.VOURDEV_SERVICE_KEY || '3u820qD0ZIPTI6dRDmmvQ3hWh8jNLa5W7slDkp/oBhs='
  if (authHeader && serviceKey && authHeader === `Bearer ${serviceKey}`) {
    return true
  }

  // Also check x-api-key or query token
  const apiKey = request.headers.get('x-service-key') || request.headers.get('x-api-key')
  if (apiKey && apiKey === serviceKey) {
    return true
  }

  return false
}

/**
 * GET /api/generator/blog
 * Mengambil daftar artikel yang dihasilkan oleh generator atau status terakhir
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!isAuthorized(request, user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))

    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)

    return NextResponse.json({
      success: true,
      total: posts.length,
      docs: posts,
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
 * Memicu proses pembuatan artikel blog otomatis dari Topic Bank
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
    const specificTopic = body.topic ?? undefined

    const result = await runBlogGeneratorWorkflow({
      autoPublish,
      specificTopic,
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
