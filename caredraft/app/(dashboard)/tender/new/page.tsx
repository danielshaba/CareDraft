'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Target,
  MapPin,
  Building,
  Loader2,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'uploaded' | 'parsing' | 'parsed' | 'error'
  progress: number
  parsedData?: any
  error?: string
}

interface ParsedTenderData {
  title?: string
  issuing_authority?: string
  deadline?: string
  contract_value?: string
  region?: string
  description?: string
  evaluation_criteria?: any[]
  compliance_requirements?: string[]
  key_dates?: any[]
}

export default function NewTenderPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isParsingMode, setIsParsingMode] = useState(true)
  const [parsedData, setParsedData] = useState<ParsedTenderData>({})
  const [formData, setFormData] = useState({
    title: '',
    issuing_authority: '',
    deadline: '',
    contract_value: '',
    region: '',
    description: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // File upload handling
  const handleFileUpload = useCallback(async (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Upload and parse each file
    for (const fileData of newFiles) {
      try {
        const file = files[Array.from(files).findIndex(f => f.name === fileData.name)]
        
        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)

        // Upload with progress simulation (real upload happens quickly)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, progress: 25 } : f
        ))

        const response = await fetch('/api/tender/upload-document', {
          method: 'POST',
          body: formData
        })

        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, progress: 50, status: 'uploaded' } : f
        ))

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        // Start parsing
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'parsing', progress: 75 } : f
        ))

        const result = await response.json()
        
        if (result.success && result.document.parsed_metadata) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileData.id ? { 
              ...f, 
              status: 'parsed',
              progress: 100,
              parsedData: result.document.parsed_metadata 
            } : f
          ))

          // Merge parsed data
          setParsedData(prev => ({ ...prev, ...result.document.parsed_metadata }))
        } else {
          throw new Error('Parsing failed')
        }

      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ))
      }
    }
  }, [])



  const handleApplyParsedData = () => {
    setFormData(prev => ({
      ...prev,
      title: parsedData.title || prev.title,
      issuing_authority: parsedData.issuing_authority || prev.issuing_authority,
      deadline: parsedData.deadline || prev.deadline,
      contract_value: parsedData.contract_value || prev.contract_value,
      region: parsedData.region || prev.region,
      description: parsedData.description || prev.description
    }))
    setIsParsingMode(false)
  }

  const handleCreateTender = async () => {
    setIsLoading(true)
    
    try {
      // Prepare tender data
      const tenderData = {
        title: formData.title || parsedData.title || '',
        issuing_authority: formData.issuing_authority || parsedData.issuing_authority || '',
        deadline: formData.deadline || parsedData.deadline || '',
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : 
                       parsedData.contract_value ? parseFloat(parsedData.contract_value.toString()) : undefined,
        region: formData.region || parsedData.region || '',
        description: formData.description || parsedData.description || '',
        workflow_type: hasSuccessfulParse ? 'auto_parsed' : 'manual',
        parsed_metadata: hasSuccessfulParse ? {
          evaluation_criteria: parsedData.evaluation_criteria || [],
          compliance_requirements: parsedData.compliance_requirements || [],
          key_dates: parsedData.key_dates || []
        } : undefined
      }

      const response = await fetch('/api/tender/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenderData)
      })

      if (!response.ok) {
        throw new Error('Failed to create tender')
      }

      const result = await response.json()
      
      if (result.success && result.tender_id) {
        // Redirect to the tender summary tab
        router.push(`/tender/${result.tender_id}/summary`)
      } else {
        throw new Error('Failed to create tender')
      }
    } catch (error) {
      console.error('Error creating tender:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsLoading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const isFormValid = isParsingMode ? 
    (uploadedFiles.some(f => f.status === 'parsed') || formData.title.trim().length > 0) :
    formData.title.trim().length > 0

  const hasSuccessfulParse = uploadedFiles.some(f => f.status === 'parsed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Kick Off New Tender
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Upload tender documents for automatic parsing, or manually enter the details below.
                Our AI will extract key information to get you started quickly.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Document Upload Section */}
        {isParsingMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-brand-50 rounded-t-lg">
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI-Powered Document Parsing
                </CardTitle>
                <CardDescription>
                  Upload tender documents (PDF, Word, Excel) and let our AI extract the key information automatically
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files) {
                      handleFileUpload(e.dataTransfer.files)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = true
                    input.accept = '.pdf,.doc,.docx,.xlsx,.xls'
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.files) {
                        handleFileUpload(target.files)
                      }
                    }
                    input.click()
                  }}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to upload
                  </h3>
                  <p className="text-gray-500">
                    Supports PDF, Word documents, and Excel files up to 50MB
                  </p>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-gray-900">Uploaded Documents</h4>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{file.name}</span>
                            <Badge 
                              variant={
                                file.status === 'parsed' ? 'default' :
                                file.status === 'error' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {file.status === 'uploading' ? 'Uploading' :
                               file.status === 'uploaded' ? 'Uploaded' :
                               file.status === 'parsing' ? 'Parsing...' :
                               file.status === 'parsed' ? 'Parsed' :
                               'Error'}
                            </Badge>
                          </div>
                          
                          {file.status === 'uploading' && (
                            <Progress value={file.progress} className="h-2" />
                          )}
                          
                          {file.status === 'parsing' && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              AI extracting information...
                            </div>
                          )}
                          
                          {file.status === 'parsed' && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Successfully extracted tender details
                            </div>
                          )}
                          
                          {file.status === 'error' && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              {file.error}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Parsed Data Preview */}
                {hasSuccessfulParse && Object.keys(parsedData).length > 0 && (
                  <div className="mt-6">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="font-medium mb-2">Information Successfully Extracted:</div>
                        <div className="space-y-1 text-sm">
                          {parsedData.title && <div>• Title: {parsedData.title}</div>}
                          {parsedData.issuing_authority && <div>• Authority: {parsedData.issuing_authority}</div>}
                          {parsedData.contract_value && <div>• Value: £{parseInt(parsedData.contract_value).toLocaleString()}</div>}
                          {parsedData.deadline && <div>• Deadline: {new Date(parsedData.deadline).toLocaleDateString()}</div>}
                          {parsedData.region && <div>• Region: {parsedData.region}</div>}
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleApplyParsedData}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Use Extracted Data
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsParsingMode(false)}
                      >
                        Enter Manually Instead
                      </Button>
                    </div>
                  </div>
                )}

                {/* Manual Entry Option */}
                {uploadedFiles.length === 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 mb-3">Or skip auto-parsing and enter details manually</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsParsingMode(false)}
                    >
                      Enter Details Manually
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Manual Form */}
        {!isParsingMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-brand-50 rounded-t-lg">
                <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Tender Information
                </CardTitle>
                <CardDescription>
                  Enter the basic details to get started with your tender workflow
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Tender Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., NHS Community Care Services - Yorkshire Region"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A descriptive title for this tender opportunity
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Issuing Authority */}
                    <div>
                      <Label htmlFor="issuing_authority" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Issuing Authority
                      </Label>
                      <Input
                        id="issuing_authority"
                        placeholder="e.g., NHS Yorkshire and Humber ICB"
                        value={formData.issuing_authority}
                        onChange={(e) => handleInputChange('issuing_authority', e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    {/* Region */}
                    <div>
                      <Label htmlFor="region" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Region/Location
                      </Label>
                      <Input
                        id="region"
                        placeholder="e.g., Yorkshire, London, Birmingham"
                        value={formData.region}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deadline */}
                    <div>
                      <Label htmlFor="deadline" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Submission Deadline
                      </Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    {/* Contract Value */}
                    <div>
                      <Label htmlFor="contract_value" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Contract Value (£)
                      </Label>
                      <Input
                        id="contract_value"
                        type="number"
                        placeholder="e.g., 2500000"
                        value={formData.contract_value}
                        onChange={(e) => handleInputChange('contract_value', e.target.value)}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the total contract value in pounds
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Brief Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief overview of the tender requirements or your initial thoughts..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Option to go back to parsing */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      onClick={() => setIsParsingMode(true)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Try Document Upload Instead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex justify-between items-center"
        >
          <div className="text-sm text-gray-500">
            Step 1 of 11 - Tender Kick-Off
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleCreateTender}
              disabled={!isFormValid || isLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Tender
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Preview */}
        {(formData.title || Object.keys(parsedData).length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            <Card className="border-teal-200 bg-teal-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Preview
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      DRAFT
                    </Badge>
                    <span className="font-medium">
                      {formData.title || parsedData.title || 'Untitled Tender'}
                    </span>
                  </div>
                  
                  {(formData.issuing_authority || parsedData.issuing_authority) && (
                    <div className="text-gray-600">
                      Issuing Authority: {formData.issuing_authority || parsedData.issuing_authority}
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-gray-600">
                    {(formData.region || parsedData.region) && (
                      <span>📍 {formData.region || parsedData.region}</span>
                    )}
                    {(formData.contract_value || parsedData.contract_value) && (
                      <span>💰 £{parseInt(formData.contract_value || parsedData.contract_value || '0').toLocaleString()}</span>
                    )}
                    {(formData.deadline || parsedData.deadline) && (
                      <span>📅 {new Date(formData.deadline || parsedData.deadline || '').toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
} 