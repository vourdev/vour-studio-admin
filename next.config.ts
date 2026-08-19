import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required by the Dockerfile: its runner stage copies .next/standalone,
  // which Next only emits when this is set. Dropping it breaks the image
  // build even though `next build` itself still succeeds.
  output: 'standalone',
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
