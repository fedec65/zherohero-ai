/**
 * MCP Tabs Component
 * Navigation tabs for Built-in Servers, Custom Servers, and Add Custom Server
 */

import React from 'react';
import { Plus, Server, Settings } from 'lucide-react';
import { Button } from '../ui/button';

export type MCPTab = 'builtin' | 'custom' | 'add';

interface MCPTabsProps {
  activeTab: MCPTab;
  onTabChange: (tab: MCPTab) => void;
  builtinCount?: number;
  customCount?: number;
  className?: string;
}

export function MCPTabs({ 
  activeTab, 
  onTabChange, 
  builtinCount = 0, 
  customCount = 0,
  className = '' 
}: MCPTabsProps) {
  const tabs = [
    {
      id: 'builtin' as MCPTab,
      label: 'Built-in Servers',
      icon: Server,
      count: builtinCount,
    },
    {
      id: 'custom' as MCPTab,
      label: 'Custom Servers',
      icon: Settings,
      count: customCount,
    },
    {
      id: 'add' as MCPTab,
      label: 'Add Custom Server',
      icon: Plus,
    },
  ];

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="MCP Server Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              <Icon 
                className={`
                  mr-2 h-4 w-4 transition-colors
                  ${isActive 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                  }
                `} 
              />
              
              <span>{tab.label}</span>
              
              {tab.count !== undefined && tab.count > 0 && (
                <span 
                  className={`
                    ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[1.5rem] h-5
                    ${isActive
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }
                  `}
                  aria-label={`${tab.count} servers`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}