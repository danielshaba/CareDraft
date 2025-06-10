'use client'

import React, { useState } from 'react'
import { Download, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

import { 
  CompliancePDFGenerator, 
  type CompliancePDFOptions, 
  type CompliancePDFResult 
} from '@/lib/services/compliance-pdf'

interface CompliancePDFExportProps {
  proposalId: string
  proposalName?: string
  organizationName?: string
  className?: string
  variant?: 'button' | 'card'
  compact?: boolean
}

interface ExportOptionsState {
  includeStatistics: boolean
  includeNotes: boolean
  includeConfidenceScores: boolean
  includeSourcePages: boolean
  groupBySource: boolean
  showOnlyCompleted: boolean
  showOnlyPending: boolean
  watermark: string
  pageFormat: 'a4' | 'letter'
}

export function CompliancePDFExport({ 
  proposalId, 
  proposalName,
  organizationName,
  className = '',
  variant = 'button',
  compact = false
}: CompliancePDFExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptionsState>({
    includeStatistics: true,
    includeNotes: true,
    includeConfidenceScores: false,
    includeSourcePages: true,
    groupBySource: true,
    showOnlyCompleted: false,
    showOnlyPending: false,
    watermark: '',
    pageFormat: 'a4'
  })

  const toast = useToast()

  const handleExport = async (quickExport = false) => {
    try {
      setIsExporting(true)

      const options: CompliancePDFOptions = {
        proposalName: proposalName || `Proposal ${proposalId}`,
        organizationName: organizationName || 'CareDraft',
        ...(!quickExport && exportOptions)
      }

      const generator = new CompliancePDFGenerator(options)
      const result: CompliancePDFResult = await generator.generateCompliancePDF(proposalId, options)

      if (result.success && result.blob) {
        // Create download link
        const url = URL.createObjectURL(result.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(
          'PDF Export Successful',
          `Generated compliance checklist with ${result.statistics.totalItems} items (${result.statistics.completionPercentage}% complete)`
        )
      } else {
        throw new Error(result.error || 'PDF generation failed')
      }

    } catch {
      console.error('PDF export failed:', error)
      toast.error(
        'PDF Export Failed',
        error instanceof Error ? error.message : 'Failed to generate PDF'
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleQuickExport = () => handleExport(true)
  
  const handleCustomExport = () => handleExport(false)

  if (variant === 'card') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-brand-600" />
              <h3 className="font-medium text-gray-900">Export Compliance PDF</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              PDF Export
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600">
            Generate a professional PDF report of your compliance checklist with customizable options.
          </p>

          {/* Export Options Toggle */}
          {!compact && (
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>{showOptions ? 'Hide Options' : 'Show Options'}</span>
              </Button>

              {showOptions && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeStatistics}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeStatistics: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Include Statistics</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeNotes}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeNotes: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Include Notes</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exportOptions.groupBySource}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        groupBySource: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Group by Source</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSourcePages}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeSourcePages: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Source Pages</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <LoadingButton
              onClick={handleQuickExport}
              isLoading={isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Quick Export
            </LoadingButton>

            {!compact && (
              <LoadingButton
                variant="outline"
                onClick={handleCustomExport}
                isLoading={isExporting}
                className="flex-1"
              >
                Custom Export
              </LoadingButton>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Button variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingButton
        onClick={handleQuickExport}
        isLoading={isExporting}
        variant="outline"
        size={compact ? "sm" : "default"}
      >
        <Download className="h-4 w-4 mr-2" />
        Export PDF
      </LoadingButton>

      {!compact && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default CompliancePDFExport 