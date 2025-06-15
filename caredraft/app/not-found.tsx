'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Search, FileText } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* CareDraft Logo */}
          <div className="mb-8">
            <Logo size="xl" className="mx-auto" />
          </div>

          {/* 404 Illustration */}
          <div className="mx-auto flex items-center justify-center w-24 h-24 bg-teal-100 rounded-full mb-8">
            <div className="text-4xl font-bold text-teal-600">404</div>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Sorry, we couldn't find the page you're looking for. It might have been moved, 
            deleted, or the URL might be incorrect.
          </p>

          {/* Quick Links */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What would you like to do?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard"
                className="flex items-center justify-center p-4 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors group"
              >
                <FileText className="w-5 h-5 text-teal-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-teal-900">View Dashboard</div>
                  <div className="text-sm text-teal-600">Manage your proposals</div>
                </div>
              </Link>
              
              <Link
                href="/search"
                className="flex items-center justify-center p-4 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors group"
              >
                <Search className="w-5 h-5 text-teal-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-teal-900">Search Content</div>
                  <div className="text-sm text-teal-600">Find what you need</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              Still having trouble? We're here to help.
            </p>
            <Link
              href="/contact"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 