import { Metadata } from 'next'
import { MCPLayout } from '../../components/layout'
import { MCPServerList } from '../../components/mcp'

export const metadata: Metadata = {
  title: 'MCP Servers - ZheroHero AI',
  description:
    'Configure Model Context Protocol servers for enhanced AI capabilities',
}

export default function MCPServersPage() {
  return (
    <MCPLayout>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              MCP Servers
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure Model Context Protocol servers to extend AI capabilities
              with external tools, resources, and data sources.
            </p>
          </div>

          <MCPServerList />
        </div>
      </div>
    </MCPLayout>
  )
}
