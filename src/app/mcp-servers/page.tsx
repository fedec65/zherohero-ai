import { Metadata } from 'next';
import { MCPLayout } from '../../components/layout';

export const metadata: Metadata = {
  title: 'MCP Servers - ZheroHero AI',
  description: 'Configure Model Context Protocol servers',
}

export default function MCPServersPage() {
  return (
    <MCPLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          MCP Servers
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Configure Model Context Protocol servers for enhanced AI capabilities
        </p>
        
        {/* Placeholder content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            MCP Servers page coming soon...
          </p>
        </div>
      </div>
    </MCPLayout>
  );
}