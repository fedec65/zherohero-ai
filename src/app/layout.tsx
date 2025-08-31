import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../components/layout/theme-provider'
import { THEME_SCRIPT } from '../lib/theme-script'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '../components/ui/error-boundary'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ZheroHero AI - Advanced AI Chat Interface',
  description:
    'Advanced AI chat interface supporting multiple AI models including OpenAI, Anthropic, Google Gemini, xAI, and DeepSeek',
  keywords: [
    'AI',
    'Chat',
    'OpenAI',
    'Anthropic',
    'Gemini',
    'xAI',
    'DeepSeek',
    'Machine Learning',
  ],
  authors: [{ name: 'ZheroHero Team' }],
  creator: 'ZheroHero',
  publisher: 'ZheroHero',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'ZheroHero AI',
    title: 'ZheroHero AI - Advanced AI Chat Interface',
    description: 'Advanced AI chat interface supporting multiple AI models',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ZheroHero AI - Advanced AI Chat Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@zherohero',
    creator: '@zherohero',
    title: 'ZheroHero AI - Advanced AI Chat Interface',
    description: 'Advanced AI chat interface supporting multiple AI models',
    images: ['/twitter-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#2563eb',
      },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZheroHero AI" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Application error:', error, errorInfo)
            // In production, you might want to send this to an error reporting service
          }}
          fallback={({ error, retry }) => (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center p-8">
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  Application Error
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Something went wrong. Please try refreshing the page.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={retry}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Refresh Page
                  </button>
                </div>
                {process.env.NODE_ENV === 'development' && error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer font-mono text-sm text-red-600 dark:text-red-400">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600 dark:text-red-400">
                      {error.message}
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
        >
          <ThemeProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg, #ffffff)',
                  color: 'var(--toast-text, #1f2937)',
                  border: '1px solid var(--toast-border, #e5e7eb)',
                },
              }}
            />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
