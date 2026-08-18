import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: [
      // Media served from Cloudflare R2 (S3-compatible) when storage is enabled.
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // TODO: add your R2 custom domain here, e.g. { hostname: 'media.vour.studio' },
      // if you attach one instead of the default *.r2.dev URL.
    ],
  },
  async redirects() {
    return [
      {
        // The blank-template landing page was removed. The root now goes
        // straight to the admin panel, which redirects unauthenticated
        // visitors to /admin/login.
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
