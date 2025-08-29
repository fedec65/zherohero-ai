"use client";

import { Metadata } from "next";
import { useState } from "react";
import { ModelsLayout } from "../../components/layout";
import { ModelTabs, ModelGrid } from "../../components/models";
import { PerformanceReport } from "../../components/dev/performance-report";
import { Button } from "../../components/ui/button";
import { Activity } from "lucide-react";

export default function ModelsPage() {
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);
  return (
    <ModelsLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Model Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure parameters for each AI model
              </p>
            </div>

            {process.env.NODE_ENV === "development" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPerformanceReport(true)}
                leftIcon={<Activity className="w-4 h-4" />}
              >
                Performance
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <ModelTabs />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <ModelGrid />
          </div>
        </div>

        {/* Performance Report */}
        <PerformanceReport
          show={showPerformanceReport}
          onClose={() => setShowPerformanceReport(false)}
        />
      </div>
    </ModelsLayout>
  );
}
