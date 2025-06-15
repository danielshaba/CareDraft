import { SearchInterface } from '@/components/search/SearchInterface'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-brand-600 hover:text-brand-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Research & Intelligence Search
          </h1>
          <p className="text-gray-600">
            Search across web content, research papers, and company information with care industry optimization
          </p>
        </div>

        <SearchInterface />
      </div>
    </div>
  )
} 
// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'
