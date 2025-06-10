'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading component for draft builder
const DraftBuilderSkeleton = () => (
  <div className="flex flex-col h-screen">
    {/* Header skeleton */}
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
    
    {/* Main content skeleton */}
    <div className="flex flex-1">
      {/* Sidebar skeleton */}
      <div className="w-80 border-r p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-6 w-24 mt-6" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      
      {/* Editor skeleton */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-64" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="space-y-2 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Dynamically import the DraftBuilderInterface
const DynamicDraftBuilderInterface = dynamic(
  () => import('./DraftBuilderInterface'),
  {
    loading: () => <DraftBuilderSkeleton />,
    ssr: false, // Heavy editor component, client-side only
  }
);

// Main lazy draft builder component
export default function LazyDraftBuilder(props: { proposalId?: string }) {
  return (
    <Suspense fallback={<DraftBuilderSkeleton />}>
      <DynamicDraftBuilderInterface {...props} />
    </Suspense>
  );
}
