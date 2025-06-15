import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              Need help? Contact your administrator
            </p>
            <Link
              href="/contact"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'
