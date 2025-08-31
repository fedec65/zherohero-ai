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

export function MoveChatDialog() {
  const { dialogs, closeMoveDialog, moveChat, folders, chats } = useChatStore()

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
      moveChat(dialogs.targetChatId, selectedFolderId || null)
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
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            <input
              type="radio"
              name="folder"
              checked={selectedFolderId === undefined}
              onChange={() => setSelectedFolderId(undefined)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <Home className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <span className="font-medium">Root (No Folder)</span>
              {selectedFolderId === undefined && (
                <span className="ml-2 text-xs text-gray-500">(current)</span>
              )}
            </div>
          </label>

          {/* Folder options */}
          {folderList.map((folder) => {
            const currentFolder =
              dialogs.targetChatId &&
              chats[dialogs.targetChatId]?.folderId === folder.id

            return (
              <label
                key={folder.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="radio"
                  name="folder"
                  checked={selectedFolderId === folder.id}
                  onChange={() => setSelectedFolderId(folder.id)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Folder className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <span className="font-medium">{folder.name}</span>
                  {currentFolder && (
                    <span className="ml-2 text-xs text-gray-500">
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
          <Button onClick={handleMove}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
