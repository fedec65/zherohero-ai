/** @type {import('next').NextConfig} */
let withBundleAnalyzer
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled:
      process.env.ANALYZE === 'true' && process.env.NODE_ENV === 'development',
    openAnalyzer: false,
  })
} catch (error) {
  // Bundle analyzer not available during Vercel build
  withBundleAnalyzer = (config) => config
}

const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    serverComponentsExternalPackages: [
      '@vercel/analytics',
      '@vercel/speed-insights',
    ],
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Compiler options
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

  // Bundle analysis and optimization
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Skip complex webpack modifications during Vercel build
    if (process.env.VERCEL_ENV) {
      return config
    }

    // Bundle analyzer in development only
    if (dev && !isServer && process.env.NODE_ENV === 'development') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        if (process.env.ANALYZE === 'true') {
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
            })
          )
        }
      } catch (error) {
        console.warn('Bundle analyzer not available:', error.message)
      }
    }

    // Optimize chunks and reduce bundle size
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          ai: {
            name: 'ai-providers',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](openai|@anthropic-ai|@google\/generative-ai)[\\/]/,
            priority: 40,
            enforce: true,
          },
          ui: {
            name: 'ui-components',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@headlessui|framer-motion|lucide-react)[\\/]/,
            priority: 30,
            enforce: true,
          },
          sentry: {
            name: 'sentry',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@sentry)[\\/]/,
            priority: 20,
            enforce: true,
          },
        },
      }

      // Tree shaking optimizations
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    // Reduce memory usage during build
    if (!dev && isServer) {
      config.optimization.minimize = true
      config.optimization.concatenateModules = true
    }

    return config
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Content Security Policy
  async headers() {
    const contentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' 
        https://api.openai.com
        https://api.anthropic.com
        https://generativelanguage.googleapis.com
        https://api.x.ai
        https://api.deepseek.com
        https://vercel.live
        https://vitals.vercel-insights.com;
      media-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, ' ')
      .trim()

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },

  // Redirects for SEO and UX
  async redirects() {
    return [
      {
        source: '/chat',
        destination: '/',
        permanent: false,
      },
    ]
  },

  // API route optimization
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
