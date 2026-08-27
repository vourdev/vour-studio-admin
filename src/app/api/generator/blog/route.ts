import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'

const BACKEND_URL = (process.env.BACKEND_VOUR_STUDIO_URL || 'http://localhost:4000').replace(/\/+$/, '')
const SERVICE_KEY = process.env.VOURDEV_SERVICE_KEY || ''

function isAuthorized(request: NextRequest, user: any): boolean {
  if (user) return true
  const authHeader = request.headers.get('authorization')
  if (authHeader && SERVICE_KEY && authHeader === `Bearer ${SERVICE_KEY}`) return true
  const apiKey = request.headers.get('x-service-key') || request.headers.get('x-api-key')
  if (apiKey && apiKey === SERVICE_KEY) return true
  return false
}

/**
 * GET /api/generator/blog — proxy to backend-vour-studio
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!isAuthorized(request, user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${BACKEND_URL}/api/posts?status=all`, {
      headers: { Authorization: `Bearer ${SERVICE_KEY}` },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/generator/blog — proxy to backend-vour-studio
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

    const res = await fetch(`${BACKEND_URL}/api/generator/blog`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghubungi backend-vour-studio.',
      },
      { status: 500 }
    )
  }
}
