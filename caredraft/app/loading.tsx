import React from 'react';
import { SkeletonPage } from '../components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SkeletonPage />
    </div>
  );
} 