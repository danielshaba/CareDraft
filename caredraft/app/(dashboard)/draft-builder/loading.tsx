import React from 'react';
import { SkeletonForm } from '../../../components/ui/skeleton';

export default function DraftBuilderLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar - sections */}
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main editor area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 space-x-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        
        {/* Editor content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="h-8 bg-gray-200 rounded w-96 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{
                  width: `${Math.random() * 40 + 60}%`
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right sidebar - AI assist */}
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
          <SkeletonForm fields={3} />
        </div>
      </div>
    </div>
  );
} 