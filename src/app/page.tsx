import { Metadata } from 'next';
import { ChatLayout } from '../components/layout';
import { ChatHome } from '../components/chat/chat-home';

export const metadata: Metadata = {
  title: 'Home - ZheroHero AI',
  description: 'Start your AI conversation with multiple AI models',
}

export default function HomePage() {
  return (
    <ChatLayout>
      <ChatHome />
    </ChatLayout>
  );
}