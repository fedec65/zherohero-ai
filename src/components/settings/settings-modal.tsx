'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../lib/stores/settings-store';
import { APIKeysTab } from './tabs/api-keys-tab';
import { SpeechTab } from './tabs/speech-tab';
import { ImportExportTab } from './tabs/import-export-tab';
import { AdvancedTab } from './tabs/advanced-tab';
import { AboutTab } from './tabs/about-tab';

type SettingsTab = 'apis' | 'speech' | 'import-export' | 'advanced' | 'about';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: SettingsTab;
}

export function SettingsModal({ open, onOpenChange, defaultTab = 'apis' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  
  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'apis', label: 'APIs' },
    { id: 'speech', label: 'Speech' },
    { id: 'import-export', label: 'Import/Export' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'about', label: 'About' },
  ];

  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'apis':
        return <APIKeysTab />;
      case 'speech':
        return <SpeechTab />;
      case 'import-export':
        return <ImportExportTab />;
      case 'advanced':
        return <AdvancedTab />;
      case 'about':
        return <AboutTab />;
      default:
        return <APIKeysTab />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              "relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-xl",
              "max-h-[90vh] flex flex-col"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h1 
                id="settings-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                Settings
              </h1>
              <button
                onClick={handleClose}
                className={cn(
                  "rounded-lg p-2 text-gray-400 hover:text-gray-600",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "transition-colors"
                )}
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar with tabs */}
              <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <nav className="p-2 space-y-1" role="tablist">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`${tab.id}-panel`}
                      id={`${tab.id}-tab`}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
  );
}