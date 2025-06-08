'use client';

import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// Loading component for dynamic imports
export const DynamicLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

// Generic dynamic import wrapper with error handling
export function createDynamicComponent<T = Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
  } = {}
) {
  return dynamic(importFn, {
    loading: options.loading || DynamicLoading,
    ssr: options.ssr ?? true,
  });
}

// Route-based dynamic imports for main application sections
export const DynamicDraftBuilder = createDynamicComponent(
  () => import('@/app/(dashboard)/draft-builder/page'),
  { ssr: false } // Heavy editor, load client-side only
);

export const DynamicKnowledgeHub = createDynamicComponent(
  () => import('@/app/(dashboard)/knowledge-hub/page'),
  { ssr: true }
);

export const DynamicBrainstorm = createDynamicComponent(
  () => import('@/app/(dashboard)/brainstorm/page'),
  { ssr: false } // Interactive features, client-side
);

export const DynamicExtract = createDynamicComponent(
  () => import('@/app/(dashboard)/extract/page'),
  { ssr: false } // File processing, client-side
);

export const DynamicAnswerBank = createDynamicComponent(
  () => import('@/app/(dashboard)/answer-bank/page'),
  { ssr: true }
);

export const DynamicTenderDetails = createDynamicComponent(
  () => import('@/app/(dashboard)/tender-details/page'),
  { ssr: true }
);

export const DynamicCompliance = createDynamicComponent(
  () => import('@/app/(dashboard)/tender-details/compliance/page'),
  { ssr: false } // Heavy document processing
);

export const DynamicUserManagement = createDynamicComponent(
  () => import('@/app/(dashboard)/settings/users/page'),
  { ssr: true }
);

// Component-based dynamic imports for heavy UI components
export const DynamicRichTextEditor = createDynamicComponent(
  () => import('@/components/draft-builder/DraftBuilderInterface'),
  { ssr: false }
);

export const DynamicPDFViewer = createDynamicComponent(
  () => import('@/components/shared/DocumentPreview'),
  { ssr: false }
);

// Utility function to prefetch critical components
export const prefetchCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Prefetch commonly used components
    import('@/components/draft-builder/DraftBuilderInterface');
    import('@/components/shared/DocumentPreview');
  }
}; 