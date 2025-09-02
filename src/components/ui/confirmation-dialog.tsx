/**
 * Confirmation Dialog - Better UX for destructive actions
 */

'use client'

import React, { useCallback } from 'react'
import { AlertTriangle, Trash2, FolderX, Info, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog'
import { Button } from './button'
import { cn } from '../../lib/utils'

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmationType
  icon?: React.ReactNode
  loading?: boolean
  disabled?: boolean
  destructive?: boolean
  /** Additional details to show in a collapsible section */
  details?: React.ReactNode
  /** Show checkbox for "don't show again" */
  showDontShowAgain?: boolean
  onDontShowAgainChange?: (checked: boolean) => void
}

const typeConfig = {
  danger: {
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    confirmButtonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  }
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon,
  loading = false,
  disabled = false,
  destructive = false,
  details,
  showDontShowAgain = false,
  onDontShowAgainChange,
}: ConfirmationDialogProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [dontShowAgain, setDontShowAgain] = React.useState(false)

  const config = typeConfig[type]
  const IconComponent = icon ? () => icon : config.icon

  const handleConfirm = useCallback(() => {
    if (showDontShowAgain && onDontShowAgainChange) {
      onDontShowAgainChange(dontShowAgain)
    }
    onConfirm()
  }, [onConfirm, showDontShowAgain, onDontShowAgainChange, dontShowAgain])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !loading) {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [disabled, loading, handleConfirm, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-w-md',
          config.borderColor,
          config.bgColor
        )}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('flex-shrink-0', config.color)}>
              <IconComponent className="h-6 w-6" />
            </div>
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        {details && (
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
            {showDetails && (
              <div className="mt-2 p-3 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">
                {details}
              </div>
            )}
          </div>
        )}

        {showDontShowAgain && (
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Don&apos;t show this again
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={disabled || loading}
            className={cn(
              'min-w-[80px]',
              destructive || type === 'danger' 
                ? config.confirmButtonClass + ' text-white'
                : config.confirmButtonClass + ' text-white'
            )}
            loading={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Convenience hooks for common confirmation dialogs
export const useConfirmation = () => {
  const [state, setState] = React.useState<{
    isOpen: boolean
    config: Partial<ConfirmationDialogProps>
    resolve?: (confirmed: boolean) => void
  }>({
    isOpen: false,
    config: {}
  })

  const confirm = useCallback((config: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        config,
        resolve
      })
    })
  }, [])

  const handleClose = useCallback(() => {
    state.resolve?.(false)
    setState({ isOpen: false, config: {} })
  }, [state.resolve])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState({ isOpen: false, config: {} })
  }, [state.resolve])

  const ConfirmationComponent = useCallback(() => {
    if (!state.isOpen) return null

    return (
      <ConfirmationDialog
        {...state.config}
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={state.config.title || 'Confirm Action'}
        description={state.config.description || 'Are you sure?'}
      />
    )
  }, [state, handleClose, handleConfirm])

  return { confirm, ConfirmationComponent }
}

// Preset confirmation dialogs
export const ConfirmationPresets = {
  deleteChat: (chatName: string) => ({
    title: 'Delete Chat',
    description: `Are you sure you want to delete "${chatName}"? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger' as ConfirmationType,
    destructive: true,
    details: (
      <div>
        <p>This will permanently remove:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>All messages in this chat</li>
          <li>Chat history and metadata</li>
          <li>Any attachments or files</li>
        </ul>
      </div>
    )
  }),

  deleteFolder: (folderName: string, chatCount: number) => ({
    title: 'Delete Folder',
    description: `Are you sure you want to delete "${folderName}"? ${
      chatCount > 0 ? `All ${chatCount} chats will be moved to the root level.` : ''
    }`,
    confirmText: 'Delete Folder',
    cancelText: 'Cancel',
    type: 'danger' as ConfirmationType,
    destructive: true,
    details: chatCount > 0 ? (
      <div>
        <p>This will:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Delete the folder permanently</li>
          <li>Move {chatCount} chat{chatCount !== 1 ? 's' : ''} to the root level</li>
          <li>Preserve all chat content and history</li>
        </ul>
      </div>
    ) : undefined
  }),

  clearAllChats: () => ({
    title: 'Clear All Chats',
    description: 'This will delete all your chats and cannot be undone. Are you sure?',
    confirmText: 'Clear All',
    cancelText: 'Cancel',
    type: 'danger' as ConfirmationType,
    destructive: true,
    details: (
      <div>
        <p className="text-red-600 dark:text-red-400 font-medium">⚠️ This is irreversible!</p>
        <p className="mt-2">This will permanently delete:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>All chat conversations</li>
          <li>All message history</li>
          <li>All folders and organization</li>
          <li>All attachments and files</li>
        </ul>
      </div>
    )
  }),

  moveChat: (chatName: string, folderName: string) => ({
    title: 'Move Chat',
    description: `Move "${chatName}" to folder "${folderName}"?`,
    confirmText: 'Move',
    cancelText: 'Cancel',
    type: 'info' as ConfirmationType
  })
}