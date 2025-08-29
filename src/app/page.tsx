import { Metadata } from "next";
import { ChatLayout } from "../components/layout";
import { ChatContainer } from "../components/chat/chat-container";

export const metadata: Metadata = {
  title: "Home - ZheroHero AI",
  description: "Start your AI conversation with multiple AI models",
};

export default function HomePage() {
  return (
    <ChatLayout>
      <ChatContainer className="h-full" />
    </ChatLayout>
  );
}
