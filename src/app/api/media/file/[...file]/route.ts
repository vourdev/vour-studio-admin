import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const resolvedParams = await params
  const filepath = resolvedParams.file.join('/')
  const r2Url = `${process.env.R2_PUBLIC_URL}/${filepath}`

  try {
    const res = await fetch(r2Url)
    if (!res.ok) {
      return new Response('Not Found', { status: 404 })
    }

    const headers = new Headers()
    const contentType = res.headers.get('Content-Type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new Response(res.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    return new Response('Error loading media', { status: 500 })
  }
}
