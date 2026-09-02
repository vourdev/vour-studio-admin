import { NextResponse } from 'next/server'
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { media } from '@/db/schema'
import { createIdCrudHandlers } from '@/lib/crud'
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

const defaultHandlers = createIdCrudHandlers(media, 'media')

export const { GET, PATCH } = defaultHandlers

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    if (!canWrite(user, 'media')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const docId = Number(id)
    if (isNaN(docId)) return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 })

    const [doc] = await db.select().from(media).where(eq(media.id, docId)).limit(1)
    if (doc) {
      const keysToDelete: { Key: string }[] = []
      if (doc.filename) keysToDelete.push({ Key: doc.filename })
      if (doc.sizesCardFilename) keysToDelete.push({ Key: doc.sizesCardFilename })
      if (doc.sizesOgFilename) keysToDelete.push({ Key: doc.sizesOgFilename })

      const bucket = process.env.R2_BUCKET
      if (bucket && keysToDelete.length > 0) {
        try {
          await s3.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: keysToDelete },
            })
          )
        } catch (err) {
          console.error('Error deleting media from S3/R2:', err)
        }
      }

      await db.delete(media).where(eq(media.id, docId))
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Gagal menghapus media.' },
      { status: 500 }
    )
  }
}
