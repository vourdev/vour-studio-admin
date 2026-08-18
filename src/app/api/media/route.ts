import { NextResponse } from 'next/server'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

import { db } from '@/db'
import { media } from '@/db/schema'
import { createCrudHandlers } from '@/lib/crud'
import { getCurrentUser } from '@/lib/get-current-user'
import { canWrite } from '@/lib/permissions'

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

const defaultHandlers = createCrudHandlers(media, 'media')

export const { GET, DELETE } = defaultHandlers

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    if (!canWrite(user, 'media')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ message: 'File tidak ditemukan.' }, { status: 400 })
    }

    const payloadStr = formData.get('_payload') as string | null
    const payload = payloadStr ? JSON.parse(payloadStr) : {}
    const alt = payload.alt || 'Gamba produk'

    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // 1. Get original metadata
    const originalMetadata = await sharp(buffer).metadata()
    const width = originalMetadata.width || 0
    const height = originalMetadata.height || 0

    // 2. Generate sizes card (768x432) & og (1200x630) using sharp
    const cardBuffer = await sharp(buffer)
      .resize(768, 432, { fit: 'cover', position: 'center' })
      .toBuffer()

    const ogBuffer = await sharp(buffer)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .toBuffer()

    const cardKey = `card-${cleanFileName}`
    const ogKey = `og-${cleanFileName}`

    // 3. Upload to R2 in parallel
    const bucket = process.env.R2_BUCKET || ''
    await Promise.all([
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: cleanFileName,
          Body: buffer,
          ContentType: file.type,
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: cardKey,
          Body: cardBuffer,
          ContentType: file.type,
        })
      ),
      s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: ogKey,
          Body: ogBuffer,
          ContentType: file.type,
        })
      ),
    ])

    // 4. Save to database
    const [inserted] = await db
      .insert(media)
      .values({
        alt,
        url: `/api/media/file/${cleanFileName}`,
        filename: cleanFileName,
        mimeType: file.type,
        filesize: String(file.size),
        width: String(width),
        height: String(height),
        sizesCardUrl: `/api/media/file/${cardKey}`,
        sizesCardFilename: cardKey,
        sizesCardWidth: '768',
        sizesCardHeight: '432',
        sizesCardMimeType: file.type,
        sizesCardFilesize: String(cardBuffer.length),
        sizesOgUrl: `/api/media/file/${ogKey}`,
        sizesOgFilename: ogKey,
        sizesOgWidth: '1200',
        sizesOgHeight: '630',
        sizesOgMimeType: file.type,
        sizesOgFilesize: String(ogBuffer.length),
      })
      .returning()

    return NextResponse.json(inserted)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Gagal mengunggah media.' },
      { status: 500 }
    )
  }
}
