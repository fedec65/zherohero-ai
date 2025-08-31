'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'

export interface DropdownMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function DropdownMenu({ open, onOpenChange, children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <div className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            onOpenChange: handleOpenChange,
          })
        }
        return child
      })}
    </div>
  )
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ asChild, children, isOpen, onOpenChange }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenChange?.(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: handleClick,
    })
  }

  return (
    <button ref={ref} onClick={handleClick}>
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

export interface DropdownMenuContentProps {
  align?: 'start' | 'center' | 'end'
  className?: string
  children: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenuContent({
  align = 'start',
  className,
  children,
  isOpen,
  onOpenChange,
}: DropdownMenuContentProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onOpenChange])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md animate-in fade-in-0 zoom-in-95',
        'dark:border-gray-700 dark:bg-gray-900',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'start' && 'left-0',
        className
      )}
      style={{ marginTop: '0.25rem' }}
    >
      {children}
    </div>
  )
}

export interface DropdownMenuItemProps {
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}

export function DropdownMenuItem({
  className,
  children,
  onClick,
  disabled = false,
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-gray-100 hover:text-gray-900',
        'dark:hover:bg-gray-800 dark:hover:text-gray-50',
        'focus:bg-gray-100 focus:text-gray-900',
        'dark:focus:bg-gray-800 dark:focus:text-gray-50',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700" />
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn('px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-50', className)}
    >
      {children}
    </div>
  )
}