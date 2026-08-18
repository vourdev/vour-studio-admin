import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const resolvedParams = await params
  const filepath = resolvedParams.file.join('/')

  try {
    const s3Res = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET || '',
        Key: filepath,
      })
    )

    if (!s3Res.Body) {
      return new Response('Not Found', { status: 404 })
    }

    const headers = new Headers()
    if (s3Res.ContentType) {
      headers.set('Content-Type', s3Res.ContentType)
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    const responseStream = s3Res.Body.transformToWebStream()

    return new Response(responseStream as any, {
      status: 200,
      headers,
    })
  } catch (error) {
    return new Response('Error loading media', { status: 500 })
  }
}
