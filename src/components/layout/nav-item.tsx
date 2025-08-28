'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/tooltip';
import { UserProfileMenu } from '../settings/user-profile-menu';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  className?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  active: activeProp,
  className,
  onClick,
  badge 
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = activeProp ?? pathname === href;

  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        isActive && 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        !isActive && 'text-gray-600 dark:text-gray-400',
        className
      )}
      aria-label={label}
      role="button"
      tabIndex={0}
    >
      <Icon className="h-5 w-5" />
      {badge && (
        <span className="absolute -top-1 -right-1">
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <Tooltip content={label} side="right">
      {content}
    </Tooltip>
  );
}

interface UserAvatarProps {
  name?: string;
  image?: string;
  className?: string;
  onSettingsClick: () => void;
}

export function UserAvatar({ name = 'User', image, className, onSettingsClick }: UserAvatarProps) {
  return (
    <UserProfileMenu
      userName={name}
      userImage={image}
      onSettingsClick={onSettingsClick}
    />
  );
}