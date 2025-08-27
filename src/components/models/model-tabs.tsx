'use client';

import { clsx } from 'clsx';
import { Plus, ExternalLink } from 'lucide-react';
import { useModelStore } from '../../../lib/stores/model-store';

interface Tab {
  id: 'builtin' | 'custom' | 'openrouter';
  label: string;
  icon?: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'builtin', label: 'Built-in Models' },
  { id: 'custom', label: 'Custom Models' },
  { id: 'openrouter', label: 'OpenRouter', icon: <ExternalLink className="h-4 w-4" /> },
];

const addCustomTab: Tab = {
  id: 'builtin', // placeholder, custom logic handles this
  label: 'Add Custom Model',
  icon: <Plus className="h-4 w-4" />,
};

export function ModelTabs() {
  const { activeTab, setActiveTab, customModels } = useModelStore();

  const handleTabClick = (tabId: 'builtin' | 'custom' | 'openrouter') => {
    setActiveTab(tabId);
  };

  const handleAddCustomModel = () => {
    // TODO: Open modal to add custom model
    console.log('Open add custom model dialog');
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={clsx(
                'flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              )}
              type="button"
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'custom' && customModels.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                  {customModels.length}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Add Custom Model Tab */}
        <button
          onClick={handleAddCustomModel}
          className={clsx(
            'flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
            'ml-auto' // Push to the right
          )}
          type="button"
        >
          {addCustomTab.icon}
          {addCustomTab.label}
        </button>
      </nav>
    </div>
  );
}