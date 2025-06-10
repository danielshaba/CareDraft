'use client'

import React, { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { downloadFile, STORAGE_BUCKETS } from '@/lib/storage'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface DocumentPreviewProps {
  filePath: string
  fileName: string
  fileType: string
  isOpen: boolean
  onClose: () => void
}

interface PDFPreviewProps {
  filePath: string
  fileName: string
}

function PDFPreview({ filePath, fileName }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`Failed to load PDF: ${error.message}`)
    setLoading(false)
  }, [])

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1))
  }, [numPages])

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3.0, prev + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }, [])

  const handleDownload = useCallback(async () => {
    try {
      await downloadFile(STORAGE_BUCKETS.TENDER_DOCUMENTS, filePath)
    } catch {
      console.error('Download failed:', error)
    }
  }, [filePath, fileName])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* PDF Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="border rounded-lg overflow-auto max-h-[600px] bg-gray-100 p-4">
        <div className="flex justify-center">
          <Document
            file={filePath}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}

function DocumentFallback({ fileName, fileType, filePath }: { fileName: string, fileType: string, filePath: string }) {
  const handleDownload = useCallback(async () => {
    try {
      await downloadFile(STORAGE_BUCKETS.TENDER_DOCUMENTS, filePath)
    } catch {
      console.error('Download failed:', error)
    }
  }, [filePath, fileName])

  const getFileIcon = () => {
    if (fileType.includes('word') || fileName.endsWith('.docx')) {
      return <FileText className="h-16 w-16 text-brand-600" />
    }
    if (fileName.endsWith('.odt')) {
      return <FileText className="h-16 w-16 text-orange-600" />
    }
    return <FileText className="h-16 w-16 text-gray-600" />
  }

  const getFileTypeName = () => {
    if (fileType.includes('word') || fileName.endsWith('.docx')) {
      return 'Word Document'
    }
    if (fileName.endsWith('.odt')) {
      return 'OpenDocument Text'
    }
    return 'Document'
  }

  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      {getFileIcon()}
      <div className="text-center">
        <h3 className="font-medium text-gray-900">{fileName}</h3>
        <p className="text-sm text-gray-600">{getFileTypeName()}</p>
      </div>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Preview not available for this file type. You can download the file to view it.
        </AlertDescription>
      </Alert>
      <Button onClick={handleDownload} className="mt-4">
        <Download className="h-4 w-4 mr-2" />
        Download File
      </Button>
    </div>
  )
}

export function DocumentPreview({ filePath, fileName, fileType, isOpen, onClose }: DocumentPreviewProps) {
  if (!isOpen) return null

  const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold truncate">
            {fileName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isPDF ? (
            <PDFPreview filePath={filePath} fileName={fileName} />
          ) : (
            <DocumentFallback fileName={fileName} fileType={fileType} filePath={filePath} />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 