'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../lib/stores/settings-store'
import { APIKeysTab } from './tabs/api-keys-tab'
import { SpeechTab } from './tabs/speech-tab'
import { ImportExportTab } from './tabs/import-export-tab'
import { AdvancedTab } from './tabs/advanced-tab'
import { AboutTab } from './tabs/about-tab'
import { useMounted } from '../../lib/hooks/use-mounted'
import { ErrorBoundary } from '../ui/error-boundary'

type SettingsTab = 'apis' | 'speech' | 'import-export' | 'advanced' | 'about'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: SettingsTab
}

function SettingsModalInner({
  open,
  onOpenChange,
  defaultTab = 'apis',
}: SettingsModalProps) {
  const mounted = useMounted()
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab)

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'apis', label: 'APIs' },
    { id: 'speech', label: 'Speech' },
    { id: 'import-export', label: 'Import/Export' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'about', label: 'About' },
  ]

  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'apis':
        return <APIKeysTab />
      case 'speech':
        return <SpeechTab />
      case 'import-export':
        return <ImportExportTab />
      case 'advanced':
        return <AdvancedTab />
      case 'about':
        return <AboutTab />
      default:
        return <APIKeysTab />
    }
  }

  // Update tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  // Don't render during SSR or if not open
  if (!mounted || !open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              'relative w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-900',
              'flex max-h-[90vh] flex-col'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
              <h1
                id="settings-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                Settings
              </h1>
              <button
                onClick={handleClose}
                className={cn(
                  'rounded-lg p-2 text-gray-400 hover:text-gray-600',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'transition-colors'
                )}
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* Sidebar with tabs */}
              <div className="w-48 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <nav className="space-y-1 p-2" role="tablist">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`${tab.id}-panel`}
                      id={`${tab.id}-tab`}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                <div
                  role="tabpanel"
                  aria-labelledby={`${activeTab}-tab`}
                  id={`${activeTab}-panel`}
                  className="p-6"
                >
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsModal(props: SettingsModalProps) {
  return (
    <ErrorBoundary
      fallback={({ retry }) => {
        // Render a fallback modal for error state
        if (!props.open) return null
        
        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                  <div className="text-center">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Settings Error
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      Failed to load settings. Please try again.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={retry}
                        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => props.onOpenChange(false)}
                        className="rounded bg-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }}
    >
      <SettingsModalInner {...props} />
    </ErrorBoundary>
  )
}
