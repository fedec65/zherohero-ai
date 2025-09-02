'use client'

import { useState } from 'react'
import { useChatStore } from '../../lib/stores/chat-store'
import { useToast } from '../ui/toast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { FOLDER_COLORS, DEFAULT_FOLDER_COLOR, FolderColor } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

export function CreateFolderDialog() {
  const { dialogs, closeCreateFolderDialog, createFolder } = useChatStore()
  const { showToast } = useToast()
  const [folderName, setFolderName] = useState('')
  const [selectedColor, setSelectedColor] = useState<FolderColor>(DEFAULT_FOLDER_COLOR)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (folderName.trim()) {
      try {
        createFolder(folderName.trim(), selectedColor.id)
        setFolderName('')
        setSelectedColor(DEFAULT_FOLDER_COLOR)
        closeCreateFolderDialog()
        
        // Show success toast
        showToast({
          type: 'success',
          title: 'Folder Created',
          message: `"${folderName.trim()}" has been created successfully.`,
          duration: 3000,
        })
      } catch (error) {
        // Show error toast
        showToast({
          type: 'error',
          title: 'Failed to Create Folder',
          message: error instanceof Error ? error.message : 'An unexpected error occurred.',
          duration: 5000,
        })
      }
    }
  }

  const handleClose = () => {
    setFolderName('')
    setSelectedColor(DEFAULT_FOLDER_COLOR)
    closeCreateFolderDialog()
  }

  return (
    <Dialog open={dialogs.showCreateFolderDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new chat folder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Folder name input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder Name
              </label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full"
                autoFocus
              />
            </div>

            {/* Color selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Folder Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'relative h-10 w-10 rounded-full transition-all duration-200',
                      color.value,
                      'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                      color.ring,
                      selectedColor.id === color.id
                        ? 'scale-110 ring-2 ring-offset-2'
                        : 'hover:ring-2 hover:ring-offset-1'
                    )}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  >
                    {selectedColor.id === color.id && (
                      <Check className={cn('h-4 w-4 absolute inset-0 m-auto', color.textColor)} />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Selected: <span className="font-medium">{selectedColor.name}</span>
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!folderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
