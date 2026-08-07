import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Leads } from './collections/Leads'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Projects } from './collections/Projects'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Posts,
    Products,
    Projects,
    Leads,
    NewsletterSubscribers,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  // Email for admin features (e.g. password reset). Falls back to console
  // output when RESEND_API_KEY is unset. Lead notifications are sent separately
  // in the /api/leads route.
  email: resendAdapter({
    defaultFromAddress: 'noreply@vour.studio',
    defaultFromName: 'Vour Studio',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    // Media goes to Cloudflare R2 (S3-compatible) so uploads survive Vercel's
    // ephemeral filesystem and the 4.5MB serverless body limit. Falls back to
    // local filesystem when R2 env vars are unset (local development). The
    // plugin only activates when ALL of the R2 vars are present, so a
    // half-configured environment fails to upload instead of throwing.
    s3Storage({
      collections: {
        media: {
          // Files are served straight from R2's public URL, not through Payload.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => {
            // R2_ENDPOINT is only for uploads; R2_PUBLIC_URL serves the files
            // (public r2.dev subdomain or a custom domain). R2_PUBLIC_URL must
            // include the protocol (https://) so next/image can match it.
            const key = prefix ? `${prefix}/${filename}` : filename
            return `${process.env.R2_PUBLIC_URL}/${key}`
          },
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        forcePathStyle: true,
        endpoint: process.env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
      // Activates only when EVERY R2 var is set (including the public serving
      // URL), so a half-configured environment falls back to local storage
      // instead of emitting broken media URLs.
      enabled: Boolean(
        process.env.R2_BUCKET &&
          process.env.R2_ENDPOINT &&
          process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_PUBLIC_URL,
      ),
    }),
  ],
})
