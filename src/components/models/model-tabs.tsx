'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Plus, ExternalLink } from 'lucide-react'
import { useModelStore } from '../../lib/stores/model-store'
import { AddCustomModelDialog } from './add-custom-model-dialog'

interface Tab {
  id: 'builtin' | 'custom' | 'openrouter'
  label: string
  icon?: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'builtin', label: 'Built-in Models' },
  { id: 'custom', label: 'Custom Models' },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    icon: <ExternalLink className="h-4 w-4" />,
  },
]

const addCustomTab: Tab = {
  id: 'builtin', // placeholder, custom logic handles this
  label: 'Add Custom Model',
  icon: <Plus className="h-4 w-4" />,
}

export function ModelTabs() {
  const { activeTab, setActiveTab, customModels } = useModelStore()
  const [showAddModelDialog, setShowAddModelDialog] = useState(false)

  const handleTabClick = (tabId: 'builtin' | 'custom' | 'openrouter') => {
    setActiveTab(tabId)
  }

  const handleAddCustomModel = () => {
    setShowAddModelDialog(true)
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={clsx(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              )}
              type="button"
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'custom' && customModels.length > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {customModels.length}
                </span>
              )}
            </button>
          )
        })}

        {/* Add Custom Model Tab */}
        <button
          onClick={handleAddCustomModel}
          data-add-custom-model
          className={clsx(
            'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
            'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
            'ml-auto' // Push to the right
          )}
          type="button"
        >
          {addCustomTab.icon}
          {addCustomTab.label}
        </button>
      </nav>

      {/* Add Custom Model Dialog */}
      {showAddModelDialog && (
        <AddCustomModelDialog
          open={showAddModelDialog}
          onOpenChange={setShowAddModelDialog}
        />
      )}
    </div>
  )
}
