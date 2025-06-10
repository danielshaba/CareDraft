'use client'

import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  File, 
  FileText, 
  Trash2, 
  Edit3, 
  Download, 
  Search, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  MoreVertical,
  Star,
  Info
} from 'lucide-react'

// Types for document management
interface DocumentMetadata {
  id: string
  title: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  lastModified: Date
  author?: string
  description?: string
  tags: string[]
  confidenceScore: number
  sourceReliability: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  chunkCount?: number
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  version: number
  category: string
  careSpecificMetadata?: {
    documentType: 'policy' | 'procedure' | 'guideline' | 'regulation' | 'best_practice' | 'research' | 'other'
    complianceRelevance: number
    lastReviewed?: Date
    reviewedBy?: string
    approvalStatus: 'draft' | 'approved' | 'archived'
  }
}

// Mock documents for demonstration
const mockDocuments: DocumentMetadata[] = [
  {
    id: 'doc-1',
    title: 'Care Quality Commission Guidance 2024',
    fileName: 'cqc-guidance-2024.pdf',
    fileType: 'application/pdf',
    fileSize: 2048576,
    uploadedAt: new Date('2024-03-15'),
    lastModified: new Date('2024-03-15'),
    author: 'Care Quality Commission',
    description: 'Official guidance on care standards and compliance requirements for residential care facilities.',
    tags: ['compliance', 'CQC', 'regulations', 'care standards'],
    confidenceScore: 0.95,
    sourceReliability: 0.98,
    processingStatus: 'completed',
    chunkCount: 45,
    embeddingStatus: 'completed',
    version: 1,
    category: 'Regulations',
    careSpecificMetadata: {
      documentType: 'regulation',
      complianceRelevance: 0.96,
      lastReviewed: new Date('2024-03-01'),
      reviewedBy: 'Compliance Team',
      approvalStatus: 'approved'
    }
  },
  {
    id: 'doc-2',
    title: 'Best Practices for Elderly Care',
    fileName: 'elderly-care-best-practices.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1024768,
    uploadedAt: new Date('2024-03-10'),
    lastModified: new Date('2024-03-12'),
    author: 'Internal Team',
    description: 'Compilation of best practices for providing quality care to elderly residents.',
    tags: ['best practices', 'elderly care', 'quality improvement'],
    confidenceScore: 0.88,
    sourceReliability: 0.85,
    processingStatus: 'completed',
    chunkCount: 32,
    embeddingStatus: 'completed',
    version: 2,
    category: 'Best Practices',
    careSpecificMetadata: {
      documentType: 'best_practice',
      complianceRelevance: 0.78,
      lastReviewed: new Date('2024-03-05'),
      reviewedBy: 'Quality Team',
      approvalStatus: 'approved'
    }
  },
  {
    id: 'doc-3',
    title: 'Dementia Care Research Study',
    fileName: 'dementia-research-2024.pdf',
    fileType: 'application/pdf',
    fileSize: 3145728,
    uploadedAt: new Date('2024-03-08'),
    lastModified: new Date('2024-03-08'),
    author: 'University Research Team',
    description: 'Latest research findings on dementia care approaches and therapeutic interventions.',
    tags: ['research', 'dementia', 'therapeutic interventions'],
    confidenceScore: 0.92,
    sourceReliability: 0.94,
    processingStatus: 'processing',
    chunkCount: 0,
    embeddingStatus: 'processing',
    version: 1,
    category: 'Research',
    careSpecificMetadata: {
      documentType: 'research',
      complianceRelevance: 0.65,
      approvalStatus: 'draft'
    }
  }
]

// Helper functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (fileType.includes('word') || fileType.includes('doc')) return <FileText className="h-5 w-5 text-brand-500" />
  return <File className="h-5 w-5 text-gray-500" />
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'failed': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getConfidenceColor = (score: number) => {
  if (score >= 0.9) return 'text-green-600'
  if (score >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}

// Document Upload Component
interface DocumentUploadProps {
  onUpload: (files: File[]) => void
  isUploading: boolean
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      onUpload(files)
    }
  }, [onUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files)
      onUpload(files)
    }
  }, [onUpload])

  return (
    <div className="border-2 border-dashed border-gray-300 hover:border-brand-primary transition-colors rounded-lg">
      <div className="p-6">
        <div
          className={`text-center ${dragActive ? 'bg-brand-primary-light' : ''} rounded-lg p-6 transition-colors`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Documents
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Supported formats: PDF, DOC, DOCX, TXT, MD • Max size: 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}

// Document Card Component
interface DocumentCardProps {
  document: DocumentMetadata
  onEdit: (document: DocumentMetadata) => void
  onDelete: (documentId: string) => void
  onDownload: (documentId: string) => void
  onReprocess: (documentId: string) => void
  onPreview: (documentId: string) => void
}

const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  onEdit, 
  onDelete, 
  onDownload, 
  onReprocess,
  onPreview 
}) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {getFileIcon(document.fileType)}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {document.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {document.fileName}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => { onPreview(document.id); setShowMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button
                onClick={() => { onEdit(document); setShowMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => { onDownload(document.id); setShowMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={() => { onReprocess(document.id); setShowMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reprocess
              </button>
              <hr className="my-1" />
              <button
                onClick={() => { onDelete(document.id); setShowMenu(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status and Processing Info */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.processingStatus)}`}>
          {document.processingStatus === 'processing' && (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          )}
          {document.processingStatus === 'completed' && (
            <CheckCircle className="h-3 w-3 mr-1" />
          )}
          {document.processingStatus === 'failed' && (
            <AlertCircle className="h-3 w-3 mr-1" />
          )}
          {document.processingStatus}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          {document.category}
        </span>
        {document.careSpecificMetadata && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 border border-brand-200">
            {document.careSpecificMetadata.documentType.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Confidence and Source Reliability Scores */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            Confidence Score
          </span>
          <span className={`text-sm font-medium ${getConfidenceColor(document.confidenceScore)}`}>
            {(document.confidenceScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-primary h-2 rounded-full transition-all" 
            style={{ width: `${document.confidenceScore * 100}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Source Reliability
          </span>
          <span className={`text-sm font-medium ${getConfidenceColor(document.sourceReliability)}`}>
            {(document.sourceReliability * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-600 h-2 rounded-full transition-all" 
            style={{ width: `${document.sourceReliability * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Document Details */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Size:</span>
          <span>{formatFileSize(document.fileSize)}</span>
        </div>
        {document.chunkCount && document.chunkCount > 0 && (
          <div className="flex justify-between">
            <span>Chunks:</span>
            <span>{document.chunkCount}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Uploaded:</span>
          <span>{document.uploadedAt.toLocaleDateString()}</span>
        </div>
        {document.careSpecificMetadata?.complianceRelevance && (
          <div className="flex justify-between">
            <span>Compliance:</span>
            <span className={getConfidenceColor(document.careSpecificMetadata.complianceRelevance)}>
              {(document.careSpecificMetadata.complianceRelevance * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {document.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {document.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
              {tag}
            </span>
          ))}
          {document.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
              +{document.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Main Document Manager Interface
export default function DocumentManagerInterface() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>(mockDocuments)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory
    const matchesStatus = filterStatus === 'all' || doc.processingStatus === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique categories for filter
  const categories = Array.from(new Set(documents.map(doc => doc.category)))

  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock documents for uploaded files
      const newDocuments = files.map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date(),
        lastModified: new Date(),
        tags: [],
        confidenceScore: 0.0,
        sourceReliability: 0.0,
        processingStatus: 'pending' as const,
        embeddingStatus: 'pending' as const,
        version: 1,
        category: 'Uncategorized'
      }))
      
      setDocuments(prev => [...newDocuments, ...prev])
    } catch {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (document: DocumentMetadata) => {
    console.log('Editing document:', document.title)
    // Implement edit functionality
  }

  const handleDelete = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    }
  }

  const handleDownload = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId)
    if (document) {
      console.log('Downloading:', document.fileName)
      // Implement actual download logic
    }
  }

  const handleReprocess = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, processingStatus: 'processing', embeddingStatus: 'processing' }
        : doc
    ))
    
    // Simulate reprocessing
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { 
              ...doc, 
              processingStatus: 'completed', 
              embeddingStatus: 'completed',
              confidenceScore: Math.random() * 0.3 + 0.7,
              sourceReliability: Math.random() * 0.2 + 0.8
            }
          : doc
      ))
    }, 3000)
  }

  const handlePreview = (documentId: string) => {
    console.log('Previewing document:', documentId)
    // Implement preview logic
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
        <p className="text-gray-600">Upload, manage, and analyze your knowledge base documents with AI-powered insights</p>
      </div>

      {/* Upload Section */}
      <DocumentUpload onUpload={handleUpload} isUploading={isUploading} />

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onReprocess={handleReprocess}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'}
          </p>
        </div>
      )}
    </div>
  )
} 