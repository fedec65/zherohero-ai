"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Settings,
  User,
  LogOut,
  HelpCircle,
  Keyboard,
  Shield,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface UserProfileMenuProps {
  onSettingsClick: () => void;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export function UserProfileMenu({
  onSettingsClick,
  userName = "User",
  userEmail,
  userImage,
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: User,
      label: "Profile",
      action: () => {
        // TODO: Implement profile management
        console.log("Profile clicked");
      },
    },
    {
      icon: Settings,
      label: "Settings",
      action: onSettingsClick,
    },
    {
      icon: Keyboard,
      label: "Keyboard Shortcuts",
      action: () => {
        // TODO: Implement keyboard shortcuts modal
        console.log("Keyboard shortcuts clicked");
      },
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      action: () => {
        window.open("/help", "_blank");
      },
    },
    {
      icon: Shield,
      label: "Privacy",
      action: () => {
        window.open("/privacy", "_blank");
      },
    },
    {
      icon: LogOut,
      label: "Sign Out",
      action: () => {
        // TODO: Implement sign out functionality
        console.log("Sign out clicked");
      },
      divider: true,
    },
  ];

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          "ring-2 ring-gray-200 dark:ring-gray-700",
          "hover:ring-blue-300 dark:hover:ring-blue-600 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "cursor-pointer",
          userImage
            ? "overflow-hidden"
            : "bg-gradient-to-br from-blue-500 to-purple-600",
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {userImage ? (
          <Image src={userImage} alt={userName} fill className="object-cover" />
        ) : (
          <span className="text-white text-sm font-medium">{initial}</span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full right-0 mb-2 w-56",
            "bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-700",
            "rounded-lg shadow-lg",
            "py-1",
            "z-50",
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  userImage
                    ? "overflow-hidden"
                    : "bg-gradient-to-br from-blue-500 to-purple-600",
                )}
              >
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {initial}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userName}
                </p>
                {userEmail && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={index}>
                  {item.divider && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  )}
                  <button
                    onClick={() => handleMenuItemClick(item.action)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left",
                      "text-sm text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                      "focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800",
                      "transition-colors",
                    )}
                    role="menuitem"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
