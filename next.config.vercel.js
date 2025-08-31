/** @type {import('next').NextConfig} */

// Simplified configuration specifically for Vercel deployment
const nextConfig = {
  // Basic configuration
  reactStrictMode: true,
  swcMinify: true,

  // Experimental features (minimal for stability)
  experimental: {
    serverComponentsExternalPackages: [
      '@vercel/analytics',
      '@vercel/speed-insights',
    ],
    optimizePackageImports: ['lucide-react'],
  },

  // Compiler options - conservative for Vercel
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Simplified webpack configuration for Vercel stability
  webpack: (config, { dev, isServer }) => {
    // Skip complex modifications during production build
    if (process.env.VERCEL_ENV && !dev) {
      return config
    }

    // Only essential modifications for local development
    if (!dev && !isServer) {
      // Ensure proper externalization of syntax highlighter
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-syntax-highlighter/dist/esm/styles/prism':
          'react-syntax-highlighter/dist/cjs/styles/prism',
      }
    }

    return config
  },

  // Essential headers only
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Simple redirects
  async redirects() {
    return [
      {
        source: '/chat',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // Skip environment validation during build
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
