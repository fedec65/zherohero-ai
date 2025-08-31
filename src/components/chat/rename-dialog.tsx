'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '../../lib/stores/chat-store'
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

export function RenameDialog() {
  const { dialogs, closeRenameDialog, renameChat, updateFolder } = useChatStore()
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (dialogs.editingItem) {
      setNewName(dialogs.editingItem.name)
    }
  }, [dialogs.editingItem])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim() && dialogs.editingItem) {
      if (dialogs.editingItem.type === 'chat') {
        renameChat(dialogs.editingItem.id, newName.trim())
      } else {
        updateFolder(dialogs.editingItem.id, { 
          id: dialogs.editingItem.id,
          name: newName.trim() 
        })
      }
      closeRenameDialog()
    }
  }

  const handleClose = () => {
    setNewName('')
    closeRenameDialog()
  }

  const itemType = dialogs.editingItem?.type === 'chat' ? 'Chat' : 'Folder'

  return (
    <Dialog open={dialogs.showRenameDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename {itemType}</DialogTitle>
          <DialogDescription>
            Enter a new name for this {itemType.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`${itemType} name`}
              className="w-full"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!newName.trim() || newName === dialogs.editingItem?.name}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}