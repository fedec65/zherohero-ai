'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/tooltip';

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
}

export function UserAvatar({ name = 'User', image, className }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  if (image) {
    return (
      <Tooltip content={name} side="right">
        <div className={cn(
          'h-8 w-8 rounded-full overflow-hidden',
          'ring-2 ring-gray-200 dark:ring-gray-700',
          'hover:ring-blue-300 dark:hover:ring-blue-600 transition-all',
          className
        )}>
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={name} side="right">
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-blue-500 to-purple-600',
        'text-white text-sm font-medium',
        'ring-2 ring-gray-200 dark:ring-gray-700',
        'hover:ring-blue-300 dark:hover:ring-blue-600 transition-all',
        'cursor-pointer',
        className
      )}>
        {initial}
      </div>
    </Tooltip>
  );
}