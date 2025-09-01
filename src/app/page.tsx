import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { ChatLayout } from '../components/layout'
import { PerformanceProvider } from '../components/performance/performance-provider'

// Simple loading component for server-side rendering
function ChatLoadingFallback() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="h-12 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}

// Lazy load the ChatContainer to reduce initial bundle size
const ChatContainer = dynamic(
  () =>
    import('../components/chat/chat-container').then((mod) => ({
      default: mod.ChatContainer,
    })),
  {
    loading: () => <ChatLoadingFallback />,
    ssr: false, // Disable SSR for chat container to prevent hydration issues
  }
)

export const metadata: Metadata = {
  title: 'Home - ZheroHero AI',
  description: 'Start your AI conversation with multiple AI models',
}

export default function HomePage() {
  return (
    <PerformanceProvider>
      <ChatLayout>
        <ChatContainer className="h-full" />
      </ChatLayout>
    </PerformanceProvider>
  )
}
