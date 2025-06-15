import React from 'react';
import { Logo } from '@/components/ui/Logo';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center px-4">
      <div className="text-center">
        {/* CareDraft Logo */}
        <div className="mb-8">
          <Logo size="xl" className="mx-auto" />
        </div>

        {/* Loading Spinner */}
        <div className="mx-auto w-16 h-16 mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-teal-600 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Loading CareDraft
          </h2>
          <p className="text-gray-600">
            Preparing your proposal workspace...
          </p>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex justify-center items-center mt-6 space-x-1">
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
} 