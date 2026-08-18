import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { payloadKv } from '@/db/schema'
import { getCurrentUser } from '@/lib/get-current-user'
import { canRead, canWrite } from '@/lib/permissions'
import { revalidateSite } from '@/hooks/revalidate-site'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { slug } = await params
    if (!canRead(user, slug as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const [record] = await db
      .select()
      .from(payloadKv)
      .where(eq(payloadKv.key, slug))
      .limit(1)

    if (!record) {
      return NextResponse.json({}, { status: 200 })
    }

    return NextResponse.json(record.data)
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { slug } = await params
    if (!canWrite(user, slug as any)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // 1. Check if key exists
    const [existing] = await db
      .select()
      .from(payloadKv)
      .where(eq(payloadKv.key, slug))
      .limit(1)

    if (existing) {
      await db
        .update(payloadKv)
        .set({ data: body })
        .where(eq(payloadKv.key, slug))
    } else {
      await db
        .insert(payloadKv)
        .values({
          key: slug,
          data: body,
        })
    }

    // 2. Trigger webhook cache invalidation on the public site
    await revalidateSite()

    return NextResponse.json(body)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.' },
      { status: 500 }
    )
  }
}
