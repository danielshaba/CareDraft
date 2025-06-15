'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { 
  FileUpload, 
  TenderDocumentUpload, 
  ExportsUpload, 
  KnowledgeBaseUpload 
} from '@/components/shared/FileUpload'
import { 
//  FileBrowser, 
  TenderDocumentBrowser, 
  ExportsBrowser, 
  KnowledgeBaseBrowser 
} from '@/components/shared/FileBrowser'
import { STORAGE_BUCKETS } from '@/lib/storage'
import { useToast } from '@/components/ui/toast'

export default function TestUploadPage() {
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState<'tender' | 'exports' | 'knowledge'>('tender')
  const toast = useToast()

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading state during hydration to prevent SSR issues
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  const handleUploadComplete = (filePath: string, fileName: string) => {
    toast.success(`Successfully uploaded ${fileName}`)
    console.log('Upload completed:', { filePath, fileName })
  }

  const handleUploadError = (error: string, fileName: string) => {
    toast.error(`Failed to upload ${fileName}: ${error}`)
    console.error('Upload error:', { error, fileName })
  }

  const tabs = [
    { id: 'tender' as const, label: 'Tender Documents', bucket: STORAGE_BUCKETS.TENDER_DOCUMENTS },
    { id: 'exports' as const, label: 'Exports', bucket: STORAGE_BUCKETS.EXPORTS },
    { id: 'knowledge' as const, label: 'Knowledge Base', bucket: STORAGE_BUCKETS.KNOWLEDGE_BASE },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Upload Test Page
          </h1>
          <p className="text-gray-600">
            Test the file upload and browser components for all storage buckets
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Files
            </h2>
            
            {activeTab === 'tender' && (
              <TenderDocumentUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                maxFiles={5}
              />
            )}
            
            {activeTab === 'exports' && (
              <ExportsUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                maxFiles={3}
              />
            )}
            
            {activeTab === 'knowledge' && (
              <KnowledgeBaseUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                maxFiles={10}
              />
            )}
          </div>

          {/* Browser Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Browse Files
            </h2>
            
            {activeTab === 'tender' && (
              <TenderDocumentBrowser
                onFileSelect={(file) => {
                  toast.info(`Selected file: ${file.name}`)
                  console.log('File selected:', file)
                }}
                allowDelete={true}
              />
            )}
            
            {activeTab === 'exports' && (
              <ExportsBrowser
                onFileSelect={(file) => {
                  toast.info(`Selected file: ${file.name}`)
                  console.log('File selected:', file)
                }}
                allowDelete={true}
              />
            )}
            
            {activeTab === 'knowledge' && (
              <KnowledgeBaseBrowser
                onFileSelect={(file) => {
                  toast.info(`Selected file: ${file.name}`)
                  console.log('File selected:', file)
                }}
                allowDelete={false} // Knowledge base files should be protected
              />
            )}
          </div>
        </div>

        {/* Generic Upload Component Demo */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Generic Upload Component
          </h2>
          <p className="text-gray-600 mb-4">
            This demonstrates the generic FileUpload component with custom configuration:
          </p>
          
          <FileUpload
            bucket={tabs.find(tab => tab.id === activeTab)?.bucket || STORAGE_BUCKETS.TENDER_DOCUMENTS}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={2}
            multiple={true}
            className="max-w-md"
          >
            <div className="space-y-2">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-2">
                  📁
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Custom Upload Area
                </p>
                <p className="text-sm text-gray-600">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Currently uploading to: {tabs.find(tab => tab.id === activeTab)?.label}
                </p>
              </div>
            </div>
          </FileUpload>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-brand-50 border border-brand-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-brand-900 mb-2">
            Testing Instructions
          </h3>
          <ul className="text-brand-800 space-y-1 text-sm">
            <li>• Switch between tabs to test different storage buckets</li>
            <li>• Try uploading different file types (PDF, DOCX, TXT, etc.)</li>
            <li>• Test drag and drop functionality</li>
            <li>• Verify file size limits are enforced</li>
            <li>• Test file download and delete operations</li>
            <li>• Check that progress tracking works correctly</li>
            <li>• Verify toast notifications appear for success/error states</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 
