'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, FileText, BarChart3 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { 
  ComplianceChecklist, 
  ComplianceStats, 
  CompliancePDFExport 
} from '@/components/compliance'

// These services would be implemented for document integration
// import { extractApiService } from '@/lib/services/extract-api'
// import { documentUploadService } from '@/lib/services/document-upload'

interface CompliancePageProps {
  searchParams: {
    proposalId?: string
    tenderName?: string
    organizationName?: string
  }
}

export default function CompliancePage({ searchParams }: CompliancePageProps) {
  const { proposalId, tenderName, organizationName } = searchParams
  // TODO: These will be used when document integration is implemented
  // const [extractedText, setExtractedText] = useState<string>('')
  // const [sourceDocumentId, setSourceDocumentId] = useState<string>('')
  const [complianceStats, setComplianceStats] = useState({
    total: 0,
    completed: 0,
    completionPercentage: 0,
    autoItems: 0,
    manualItems: 0
  })
  const [isLoadingText, setIsLoadingText] = useState(false)
  
  // TODO: Toast will be used for compliance notifications
  // const toast = useToast()

  // TODO: Auto-extract text from uploaded documents for compliance analysis
  // This would integrate with document upload and text extraction services
  useEffect(() => {
    // Placeholder for document text loading
    // In a real implementation, this would:
    // 1. Get uploaded documents for this proposal
    // 2. Extract text from documents
    // 3. Set the extracted text for compliance analysis
    
    // For now, we'll work with manually provided text
    setIsLoadingText(false)
  }, [proposalId])

  const handleStatsUpdate = (stats: {
    total: number
    completed: number
    completionPercentage: number
  }) => {
    setComplianceStats({
      ...stats,
      autoItems: 0,  // These would be calculated separately
      manualItems: 0
    })
  }

  if (!proposalId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Missing Proposal Information</h2>
          <p className="text-gray-600 mb-4">A proposal ID is required to access compliance tracking.</p>
          <Link href="/tender-details">
            <Button>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Tender Details
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="min-h-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-6xl mx-auto">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center mb-4" aria-label="Breadcrumb">
                <Link
                  href="/tender-details"
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Tender Details
                </Link>
              </nav>

              {/* Page Title and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Compliance Checklist
                  </h1>
                  <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: 'var(--font-open-sans)' }}>
                    {tenderName ? `Track compliance requirements for "${tenderName}"` : 'Track and manage proposal compliance requirements'}
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <CompliancePDFExport
                    proposalId={proposalId}
                    proposalName={tenderName}
                    organizationName={organizationName}
                    variant="button"
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Statistics Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  {/* Compliance Statistics */}
                  <Card className="p-6">
                    <div className="flex items-center mb-4">
                      <BarChart3 className="h-5 w-5 text-brand-primary mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
                    </div>
                    <ComplianceStats 
                      stats={complianceStats}
                      className="space-y-4"
                    />
                  </Card>

                  {/* Quick Actions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <CompliancePDFExport
                        proposalId={proposalId}
                        proposalName={tenderName}
                        organizationName={organizationName}
                        variant="card"
                        className="w-full"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => window.print()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Print Checklist
                      </Button>
                    </div>
                  </Card>

                  {/* Proposal Information */}
                  {(tenderName || organizationName) && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Info</h3>
                      <div className="space-y-2 text-sm">
                        {tenderName && (
                          <div>
                            <span className="font-medium text-gray-600">Tender:</span>
                            <p className="text-gray-900 mt-1">{tenderName}</p>
                          </div>
                        )}
                        {organizationName && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-600">Organization:</span>
                            <p className="text-gray-900 mt-1">{organizationName}</p>
                          </div>
                        )}
                        <div className="mt-3">
                          <span className="font-medium text-gray-600">Proposal ID:</span>
                          <p className="text-gray-900 mt-1 font-mono text-xs">{proposalId}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Main Checklist Content */}
              <div className="lg:col-span-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Compliance Requirements</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Track and manage all compliance requirements for this proposal
                      </p>
                    </div>
                    
                    {complianceStats.total > 0 && (
                      <Badge 
                        variant={complianceStats.completionPercentage >= 100 ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {complianceStats.completed}/{complianceStats.total} Complete
                      </Badge>
                    )}
                  </div>

                  {/* Loading State */}
                  {isLoadingText && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading document text for compliance analysis...</p>
                    </div>
                  )}

                  {/* Compliance Checklist */}
                  <ComplianceChecklist
                    proposalId={proposalId}
                    extractedText={extractedText}
                    sourceDocumentId={sourceDocumentId}
                    onStatsUpdate={handleStatsUpdate}
                    className="min-h-[400px]"
                  />
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 