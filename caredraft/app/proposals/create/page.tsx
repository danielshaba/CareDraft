'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  Target, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TenderDocumentUpload } from '@/components/shared/FileUpload'
import { AuthenticatedLayout } from '@/components/shared/Layout'

interface TenderFormData {
  title: string
  issuing_authority: string
  deadline: string
  contract_value: string
  region: string
  description: string
}

interface UploadedDocument {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  uploadedAt: Date
  status: 'uploaded' | 'processing' | 'processed' | 'error'
}

export default function CreateTenderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TenderFormData>({
    title: '',
    issuing_authority: '',
    deadline: '',
    contract_value: '',
    region: '',
    description: ''
  })
  
  const [uploadedDocuments] = useState<UploadedDocument[]>([])

  const steps = [
    {
      id: 1,
      title: 'Tender Details',
      description: 'Basic information about the tender opportunity',
      icon: FileText
    },
    {
      id: 2, 
      title: 'Upload Documents',
      description: 'Upload RFx documents for auto-parsing',
      icon: Upload
    },
    {
      id: 3,
      title: 'Review & Launch',
      description: 'Confirm details and start the tender workflow',
      icon: Target
    }
  ]

  const handleInputChange = (field: keyof TenderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError('Tender title is required')
          return false
        }
        return true
      case 2:
        // Documents are optional for now
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
      setError(null)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleCreateTender = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        title: formData.title,
        issuing_authority: formData.issuing_authority || undefined,
        deadline: formData.deadline || undefined,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
        region: formData.region || undefined,
        description: formData.description || undefined,
        workflow_type: uploadedDocuments.length > 0 ? 'auto_parsed' : 'manual'
      }

      const response = await fetch('/api/tender/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tender')
      }

      const data = await response.json()
      
      // Redirect to the tender workflow with the new ID
      router.push(`/tender-details/${data.tender_id}`)
      
    } catch (err) {
      console.error('Error creating tender:', err)
      setError(err instanceof Error ? err.message : 'Failed to create tender')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Tender Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Community Care Services Contract"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issuing_authority" className="text-sm font-medium text-gray-700">
                  Issuing Authority
                </Label>
                <Input
                  id="issuing_authority"
                  value={formData.issuing_authority}
                  onChange={(e) => handleInputChange('issuing_authority', e.target.value)}
                  placeholder="e.g., NHS Trust, Local Authority"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="region" className="text-sm font-medium text-gray-700">
                  Region
                </Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  placeholder="e.g., Greater London, West Midlands"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                  Submission Deadline
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contract_value" className="text-sm font-medium text-gray-700">
                  Contract Value (£)
                </Label>
                <Input
                  id="contract_value"
                  type="number"
                  value={formData.contract_value}
                  onChange={(e) => handleInputChange('contract_value', e.target.value)}
                  placeholder="e.g., 125000"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the tender opportunity..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Tender Documents
              </h3>
              <p className="text-gray-600 mb-6">
                Upload RFx documents for automatic parsing and analysis. This step is optional but recommended.
              </p>
            </div>

            <TenderDocumentUpload
              maxFiles={10}
              accept=".pdf,.docx,.doc"
            />

            {uploadedDocuments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {uploadedDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-brand-primary-500" />
                        )}
                        {doc.status === 'processed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {doc.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-brand-primary-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Launch Tender Workflow
              </h3>
              <p className="text-gray-600 mb-6">
                Review your tender details and launch the 11-step CareDraft workflow.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tender Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Title</p>
                    <p className="text-gray-900">{formData.title}</p>
                  </div>
                  {formData.issuing_authority && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Issuing Authority</p>
                      <p className="text-gray-900">{formData.issuing_authority}</p>
                    </div>
                  )}
                  {formData.deadline && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Deadline</p>
                      <p className="text-gray-900">
                        {new Date(formData.deadline).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {formData.contract_value && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Contract Value</p>
                      <p className="text-gray-900">£{parseFloat(formData.contract_value).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {uploadedDocuments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Documents</p>
                    <p className="text-gray-900">{uploadedDocuments.length} document(s) uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                Once launched, you'll be taken through the 11-step CareDraft workflow including document analysis, 
                strategy generation, question mapping, and collaborative response drafting.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AuthenticatedLayout className="bg-gray-50">
      <div className="min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center">
                <Link
                  href="/dashboard"
                  className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
              </div>
              <div className="mt-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Tender Workflow
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Set up a new tender opportunity with CareDraft's comprehensive workflow
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-4xl mx-auto">
              <nav aria-label="Progress">
                <ol className="flex items-center">
                  {steps.map((step, stepIdx) => (
                    <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                      <div className="flex items-center">
                        <div
                          className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                            step.id === currentStep
                              ? 'bg-brand-primary-500 text-white'
                              : step.id < currentStep
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          {step.id < currentStep ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="ml-4 min-w-0">
                          <p className={`text-sm font-medium ${
                            step.id === currentStep ? 'text-brand-primary-500' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500">{step.description}</p>
                        </div>
                      </div>
                      {stepIdx !== steps.length - 1 && (
                        <div
                          className={`absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 ${
                            step.id < currentStep ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <Alert className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < steps.length ? (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCreateTender}
                      disabled={isLoading}
                      className="bg-brand-primary-500 hover:bg-brand-primary-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Launch Workflow
                          <Target className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 
