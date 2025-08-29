"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
// ThemeProvider is handled in the root layout
import { SidebarNavigation } from "./sidebar-navigation";
import { ChatSidebar } from "./chat-sidebar";
import { MainContent } from "./main-content";
import { MobileNavigation } from "./mobile-navigation";
import { cn } from "../../lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showChatSidebar?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function AppLayout({
  children,
  title,
  showChatSidebar = true,
  showHeader = true,
  className,
}: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={cn("h-screen flex overflow-hidden", className)}>
      {/* Desktop Navigation Sidebar */}
      <div className="hidden lg:flex w-16 flex-shrink-0">
        <SidebarNavigation />
      </div>

      {/* Desktop Chat Sidebar */}
      {showChatSidebar && (
        <div className="hidden lg:flex flex-shrink-0">
          <ChatSidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <MainContent title={title} showHeader={showHeader} className="h-full">
          {children}
        </MainContent>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        showChatSidebar={showChatSidebar}
      />
    </div>
  );
}

// Specialized layout variants for different pages
export function ChatLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppLayout showChatSidebar={true} showHeader={true} className={className}>
      {children}
    </AppLayout>
  );
}

export function SettingsLayout({
  children,
  title = "Settings",
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <AppLayout
      title={title}
      showChatSidebar={false}
      showHeader={true}
      className={className}
    >
      {children}
    </AppLayout>
  );
}

export function ModelsLayout({
  children,
  title = "AI Models",
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <AppLayout
      title={title}
      showChatSidebar={false}
      showHeader={true}
      className={className}
    >
      {children}
    </AppLayout>
  );
}

export function MCPLayout({
  children,
  title = "MCP Servers",
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <AppLayout
      title={title}
      showChatSidebar={false}
      showHeader={true}
      className={className}
    >
      {children}
    </AppLayout>
  );
}

// Full-screen layout for special pages (like onboarding, auth, etc.)
export function FullScreenLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("h-screen w-screen overflow-hidden", className)}>
      {children}
    </div>
  );
}
