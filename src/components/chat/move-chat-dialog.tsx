'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '../../lib/stores/chat-store'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Folder, Home } from 'lucide-react'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'

export function MoveChatDialog() {
  const { dialogs, closeMoveDialog, moveChat, folders, chats } = useChatStore()
  const { showToast } = useToast()

  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined
  )

  // Reset selection when dialog opens
  useEffect(() => {
    if (dialogs.showMoveDialog && dialogs.targetChatId) {
      const chat = chats[dialogs.targetChatId]
      setSelectedFolderId(chat?.folderId)
    }
  }, [dialogs.showMoveDialog, dialogs.targetChatId, chats])

  const handleMove = () => {
    if (dialogs.targetChatId) {
      const chat = chats[dialogs.targetChatId]
      const targetFolder = selectedFolderId ? folders[selectedFolderId] : null
      
      moveChat(dialogs.targetChatId, selectedFolderId || null)
      
      // Show success toast
      const destination = targetFolder ? targetFolder.name : 'Root'
      showToast({
        type: 'success',
        title: 'Success',
        message: `Chat moved to ${destination} successfully`
      })
      
      closeMoveDialog()
    }
  }

  const handleClose = () => {
    setSelectedFolderId(undefined)
    closeMoveDialog()
  }

  const folderList = Object.values(folders)

  return (
    <Dialog open={dialogs.showMoveDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Move &ldquo;{dialogs.editingItem?.name}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Select a folder to move this chat to:
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {/* Root option */}
          <label 
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              dialogs.targetChatId && !chats[dialogs.targetChatId]?.folderId 
                ? "cursor-not-allowed opacity-50" 
                : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <input
              type="radio"
              name="folder"
              checked={selectedFolderId === undefined}
              onChange={() => setSelectedFolderId(undefined)}
              disabled={dialogs.targetChatId && !chats[dialogs.targetChatId]?.folderId}
              className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <Home className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Root (No Folder)</span>
                <span className="text-xs text-gray-500">
                  {Object.values(chats).filter(chat => !chat.folderId).length} chats
                </span>
              </div>
              {dialogs.targetChatId && !chats[dialogs.targetChatId]?.folderId && (
                <span className="text-xs text-gray-500">(current)</span>
              )}
            </div>
          </label>

          {/* Folder options */}
          {folderList.map((folder) => {
            const currentFolder =
              dialogs.targetChatId &&
              chats[dialogs.targetChatId]?.folderId === folder.id
            
            const folderChatCount = Object.values(chats).filter(
              chat => chat.folderId === folder.id
            ).length

            return (
              <label
                key={folder.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  currentFolder 
                    ? "cursor-not-allowed opacity-50" 
                    : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <input
                  type="radio"
                  name="folder"
                  checked={selectedFolderId === folder.id}
                  onChange={() => setSelectedFolderId(folder.id)}
                  disabled={currentFolder}
                  className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div 
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: folder.color || '#3b82f6' }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{folder.name}</span>
                    <span className="text-xs text-gray-500">
                      {folderChatCount} chats
                    </span>
                  </div>
                  {currentFolder && (
                    <span className="text-xs text-gray-500">
                      (current)
                    </span>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove}
            disabled={
              dialogs.targetChatId && 
              ((selectedFolderId === undefined && !chats[dialogs.targetChatId]?.folderId) ||
               (selectedFolderId === chats[dialogs.targetChatId]?.folderId))
            }
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
