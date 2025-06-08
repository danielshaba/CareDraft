'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/shared/FileUpload'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { SmartExtractionButton } from '@/components/shared/SmartExtractionButton'
import { ExtractionResultsPanel } from '@/components/shared/ExtractionResultsPanel'
import { useTextExtraction } from '@/hooks/useTextExtraction'
import { useSmartExtraction } from '@/hooks/useSmartExtraction'
import { TextExtractionResult, getExtractionMethodName } from '@/lib/text-extraction'
import { STORAGE_BUCKETS } from '@/lib/storage'
import { EXTRACTION_CATEGORIES } from '@/lib/extraction-categories'
import { FileText, Upload, AlertCircle, CheckCircle, Clock, Eye, Zap, Timer, Database, Trash2, Brain } from 'lucide-react'

interface UploadedDocument {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error'
  filePath?: string
  extractedText?: string
  extractionMetadata?: TextExtractionResult['metadata']
  error?: string
  databaseId?: string // Track database record ID
}

interface SmartExtractionState {
  isProcessing: boolean
  processingCategory: string | null
  results: Record<string, any[]> // Category ID -> extracted items
}

export default function ExtractPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [previewDocument, setPreviewDocument] = useState<UploadedDocument | null>(null)
  const [selectedDocumentForExtraction, setSelectedDocumentForExtraction] = useState<UploadedDocument | null>(null)
  const [smartExtraction, setSmartExtraction] = useState<SmartExtractionState>({
    isProcessing: false,
    processingCategory: null,
    results: {}
  })
  const { extractTextFromStorage, isExtracting } = useTextExtraction()
  const { extractFromText: smartExtractFromText, isExtracting: isSmartExtracting } = useSmartExtraction()

  const loadExistingDocuments = async () => {
    // TODO: Implement after migration is applied
    // This will load documents from the database once the migration is run
    try {
      // Placeholder for database loading
      console.log('Loading existing documents from database...')
    } catch (error) {
      console.error('Failed to load existing documents:', error)
    }
  }

  // Load existing documents from database on mount
  useEffect(() => {
    loadExistingDocuments()
  }, [])

  const handleUploadComplete = (filePath: string, fileName: string) => {
    const newDocument: UploadedDocument = {
      id: crypto.randomUUID(),
      name: fileName,
      size: 0, // We don't have file size in this callback
      type: '', // We don't have file type in this callback
      uploadedAt: new Date(),
      status: 'uploaded',
      filePath
    }
    
    setDocuments(prev => [...prev, newDocument])
  }

  const handleUploadError = (error: string, fileName: string) => {
    const errorDocument: UploadedDocument = {
      id: crypto.randomUUID(),
      name: fileName,
      size: 0,
      type: '',
      uploadedAt: new Date(),
      status: 'error',
      error
    }
    
    setDocuments(prev => [...prev, errorDocument])
  }

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      case 'uploaded':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const processDocument = async (document: UploadedDocument) => {
    if (!document.filePath) return

    setDocuments(prev => 
      prev.map(doc => 
        doc.id === document.id 
          ? { ...doc, status: 'processing' } 
          : doc
      )
    )

    try {
      const result = await extractTextFromStorage(document.filePath, document.name)
      
      // TODO: Save to database once migration is applied
      // This will save the extraction results to the database
      if (!result.error) {
        try {
          console.log('Saving extracted text to database...', {
            filePath: document.filePath,
            fileName: document.name,
            extractionResult: result
          })
          
          // Placeholder for database saving
          console.log(`Successfully extracted ${result.metadata.wordCount} words from ${document.name}`)
        } catch (dbError) {
          console.error('Failed to save to database:', dbError)
        }
      }
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { 
                ...doc, 
                status: result.error ? 'error' : 'completed',
                extractedText: result.text,
                extractionMetadata: result.metadata,
                error: result.error
              } 
            : doc
        )
      )
    } catch (error) {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { 
                ...doc, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Text extraction failed'
              } 
            : doc
        )
      )
    }
  }

  const deleteDocument = async (document: UploadedDocument) => {
    try {
      // TODO: Delete from database once migration is applied
      console.log('Deleting document from database...', document.databaseId)
      
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
      
      console.log(`Document ${document.name} has been removed`)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handlePreviewDocument = (document: UploadedDocument) => {
    if (document.filePath) {
      setPreviewDocument(document)
    }
  }

  const handleSmartExtraction = async (categoryId: string) => {
    if (!selectedDocumentForExtraction || !selectedDocumentForExtraction.extractedText) {
      alert('Please select a document with extracted text first.')
      return
    }

    setSmartExtraction(prev => ({
      ...prev,
      isProcessing: true,
      processingCategory: categoryId
    }))

    try {
      const response = await smartExtractFromText(
        selectedDocumentForExtraction.extractedText, 
        categoryId, 
        selectedDocumentForExtraction.name
      )
      
      if (response.success) {
        setSmartExtraction(prev => ({
          ...prev,
          isProcessing: false,
          processingCategory: null,
          results: {
            ...prev.results,
            [categoryId]: response.results
          }
        }))
        
        console.log(`Smart extraction completed for ${categoryId} in ${response.processingTime}ms`)
      } else {
        throw new Error(response.error || 'Smart extraction failed')
      }
    } catch (error) {
      console.error('Smart extraction failed:', error)
      setSmartExtraction(prev => ({
        ...prev,
        isProcessing: false,
        processingCategory: null
      }))
      
      // Show error to user
      alert(`Smart extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'pdf':
        return 'application/pdf'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'odt':
        return 'application/vnd.oasis.opendocument.text'
      default:
        return 'application/octet-stream'
    }
  }

  const formatProcessingTime = (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`
    }
    return `${(milliseconds / 1000).toFixed(1)}s`
  }

  const renderExtractionMetadata = (metadata: TextExtractionResult['metadata']) => (
    <div className="text-xs text-gray-500 mt-1 space-y-1">
      <div className="flex items-center gap-4">
        <span>{metadata.wordCount.toLocaleString()} words</span>
        <span>{metadata.characterCount.toLocaleString()} chars</span>
        {metadata.pageCount && <span>{metadata.pageCount} pages</span>}
      </div>
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3" />
        <span>{formatProcessingTime(metadata.processingTime)}</span>
        <span>•</span>
        <span>{getExtractionMethodName(metadata.extractionMethod)}</span>
        <Database className="h-3 w-3 text-green-600" />
      </div>
    </div>
  )

  // Get completed documents for smart extraction
  const completedDocuments = documents.filter(doc => doc.status === 'completed' && doc.extractedText)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Document Text Extraction
        </h1>
        <p className="text-gray-600">
          Upload tender documents to extract text content for analysis and bid generation
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Support for PDF, DOCX, and ODT files up to 50MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              bucket={STORAGE_BUCKETS.TENDER_DOCUMENTS}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              accept=".pdf,.docx,.odt"
              className="min-h-[200px]"
            />
            
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Supported formats: PDF, DOCX, ODT • Maximum file size: 50MB
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Document List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              Track upload progress and text extraction status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded yet</p>
                <p className="text-sm">Upload documents to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedDocumentForExtraction?.id === doc.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (doc.status === 'completed' && doc.extractedText) {
                        setSelectedDocumentForExtraction(doc)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(doc.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {doc.size > 0 && (
                              <span className="text-sm text-gray-500">
                                {formatFileSize(doc.size)}
                              </span>
                            )}
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(doc.status)}
                            >
                              {doc.status}
                            </Badge>
                            {selectedDocumentForExtraction?.id === doc.id && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Selected
                              </Badge>
                            )}
                          </div>
                          {doc.extractionMetadata && renderExtractionMetadata(doc.extractionMetadata)}
                          {doc.error && (
                            <p className="text-sm text-red-600 mt-1">
                              {doc.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {(doc.status === 'uploaded' || doc.status === 'completed') && doc.filePath && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePreviewDocument(doc)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        )}
                        {doc.status === 'uploaded' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              processDocument(doc)
                            }}
                            disabled={isExtracting}
                          >
                            <Zap className="h-4 w-4" />
                            Extract Text
                          </Button>
                        )}
                        {doc.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteDocument(doc)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Extraction Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Extraction
            </CardTitle>
            <CardDescription>
              Extract specific information categories from your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No completed extractions yet</p>
                <p className="text-sm">Upload and process documents first</p>
              </div>
            ) : (
              <>
                {selectedDocumentForExtraction ? (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Selected: {selectedDocumentForExtraction.name}
                    </p>
                    <p className="text-xs text-blue-700">
                      Click extraction buttons below to analyze this document
                    </p>
                  </div>
                ) : (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Select a completed document from the list to start smart extraction
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-3">
                  {EXTRACTION_CATEGORIES.map((category) => (
                    <SmartExtractionButton
                      key={category.id}
                      category={category}
                      isLoading={(smartExtraction.isProcessing && smartExtraction.processingCategory === category.id) || isSmartExtracting}
                      isDisabled={!selectedDocumentForExtraction || smartExtraction.isProcessing || isSmartExtracting}
                      hasResults={!!smartExtraction.results[category.id]?.length}
                      resultCount={smartExtraction.results[category.id]?.length || 0}
                      onClick={handleSmartExtraction}
                      className="w-full"
                    />
                  ))}
                </div>
                
                {/* Extraction Results Panel */}
                <ExtractionResultsPanel 
                  results={smartExtraction.results} 
                  selectedDocumentName={selectedDocumentForExtraction?.name}
                  className="mt-6"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          filePath={previewDocument.filePath!}
          fileName={previewDocument.name}
          fileType={getFileType(previewDocument.name)}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  ) 
} 