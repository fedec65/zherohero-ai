import { Metadata } from 'next';
import { ModelsLayout } from '../../components/layout';

export const metadata: Metadata = {
  title: 'Models - ZheroHero AI',
  description: 'Configure and manage AI model settings',
}

export default function ModelsPage() {
  return (
    <ModelsLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Model Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Configure parameters for each AI model
        </p>
        
        {/* Placeholder content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Models page coming soon...
          </p>
        </div>
      </div>
    </ModelsLayout>
  );
}