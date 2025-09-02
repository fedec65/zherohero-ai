'use client'

import React, { useEffect, useRef } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  onClick: () => void
  separator?: boolean
  danger?: boolean
  disabled?: boolean
}

export interface ContextMenuProps {
  isOpen: boolean
  onClose: () => void
  position: { x: number; y: number }
  items: ContextMenuItem[]
  className?: string
}

export function ContextMenu({
  isOpen,
  onClose,
  position,
  items,
  className
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && menuRef.current) {
      // Adjust position if menu would go off-screen
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 10) {
        x = viewportWidth - rect.width - 10
      }
      if (x < 10) {
        x = 10
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight - 10) {
        y = viewportHeight - rect.height - 10
      }
      if (y < 10) {
        y = 10
      }

      menu.style.left = `${x}px`
      menu.style.top = `${y}px`
    }
  }, [isOpen, position])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]',
        className
      )}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {items.map((item) => {
        if (item.separator) {
          return (
            <hr
              key={item.id}
              className="my-1 border-gray-200 dark:border-gray-700"
            />
          )
        }

        return (
          <button
            key={item.id}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              item.danger && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {item.icon && (
              <item.icon className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Hook for managing context menu state
export function useContextMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const openContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setPosition({ x: event.clientX, y: event.clientY })
    setIsOpen(true)
  }

  const closeContextMenu = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    position,
    openContextMenu,
    closeContextMenu
  }
}