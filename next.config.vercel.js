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
  },

  // Compiler options - conservative for Vercel
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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

  // Simplified webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Only essential modifications for Vercel
    if (!dev && !isServer) {
      // Ensure proper externalization of syntax highlighter
      config.externals = config.externals || []
      config.externals.push({
        'react-syntax-highlighter/dist/esm/styles/prism': 'react-syntax-highlighter/dist/cjs/styles/prism',
      })
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
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
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
}

module.exports = nextConfig