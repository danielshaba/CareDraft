'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for research interface
const ResearchSkeleton = () => (
  <div className="flex flex-col h-screen">
    {/* Header skeleton */}
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
    
    {/* Main content skeleton */}
    <div className="flex flex-1">
      {/* Search panel skeleton */}
      <div className="w-96 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 border rounded">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Results panel skeleton */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-4 w-1/2 mt-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Dynamically import research components
const DynamicResearchSessionViewer = dynamic(
  () => import('./ResearchSessionViewer').catch(() => 
    Promise.resolve({ 
      default: () => <div className="p-8 text-center">Research Session Viewer not found</div> 
    })
  ),
  {
    loading: () => <ResearchSkeleton />,
    ssr: false,
  }
);

const DynamicCreateSessionModal = dynamic(
  () => import('./CreateSessionModal').catch(() => 
    Promise.resolve({ 
      default: () => <div>Create Session Modal not found</div> 
    })
  ),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-96">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

const DynamicShareSessionModal = dynamic(
  () => import('./ShareSessionModal').catch(() => 
    Promise.resolve({ 
      default: () => <div>Share Session Modal not found</div> 
    })
  ),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-96">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Export lazy research components
export const LazyResearchSessionViewer = (props: Record<string, unknown>) => (
  <Suspense fallback={<ResearchSkeleton />}>
    <DynamicResearchSessionViewer {...props} />
  </Suspense>
);

export const LazyCreateSessionModal = (props: Record<string, unknown>) => (
  <Suspense fallback={null}>
    <DynamicCreateSessionModal {...props} />
  </Suspense>
);

export const LazyShareSessionModal = (props: Record<string, unknown>) => (
  <Suspense fallback={null}>
    <DynamicShareSessionModal {...props} />
  </Suspense>
); 