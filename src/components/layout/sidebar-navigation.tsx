"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Brain,
  Server,
  Settings,
  HelpCircle,
} from "lucide-react";
import { NavItem, UserAvatar } from "./nav-item";
import { ThemeToggle } from "./theme-toggle";
import { SettingsModal } from "../settings/settings-modal";

export function SidebarNavigation() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    {
      href: "/",
      icon: MessageSquare,
      label: "Chat",
    },
    {
      href: "/models",
      icon: Brain,
      label: "Models",
    },
    {
      href: "/mcp-servers",
      icon: Server,
      label: "MCP Servers",
    },
  ];

  const bottomItems = [
    {
      onClick: () => setSettingsOpen(true),
      icon: Settings,
      label: "Settings",
    },
    {
      href: "/help",
      icon: HelpCircle,
      label: "Help",
    },
  ];

  return (
    <nav
      className="w-16 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
      role="navigation"
      aria-label="Main navigation"
      data-testid="sidebar-nav"
    >
      {/* Top navigation items */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 pb-4 px-2">
        {/* Bottom navigation items */}
        <div className="flex flex-col items-center space-y-2">
          {bottomItems.map((item, index) => (
            <NavItem
              key={item.href || `bottom-item-${index}`}
              href={item.href || "#"}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-8 border-t border-gray-200 dark:border-gray-700" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <UserAvatar onSettingsClick={() => setSettingsOpen(true)} />
      </div>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </nav>
  );
}
