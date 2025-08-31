import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { ChatLayout } from '../components/layout'
import { LoadingSkeletons } from '../components/ui/lazy-wrapper'
import { PerformanceProvider } from '../components/performance/performance-provider'

// Lazy load the ChatContainer to reduce initial bundle size
const ChatContainer = dynamic(
  () => import('../components/chat/chat-container').then(mod => ({ default: mod.ChatContainer })),
  {
    loading: () => <LoadingSkeletons.Chat />,
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
