'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Eye,
  Target,
  Calendar,
  Building2,
  PoundSterling,
  MapPin,
  FileText,
  Users,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AuthenticatedLayout } from '@/components/shared/Layout'

interface ParsedTenderData {
  title?: string
  issuing_authority?: string
  deadline?: string
  contract_value?: number
  region?: string
  description?: string
  evaluation_criteria?: Array<{ criteria: string; weight: number }>
  compliance_requirements?: string[]
  key_dates?: Array<{ date: string; description: string }>
  confidence_score?: number
}

interface FormField {
  key: keyof ParsedTenderData
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'currency'
  required: boolean
  icon: React.ComponentType<any>
  placeholder: string
  description?: string
}

export default function ReviewExtractedDataPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [parsedData, setParsedData] = useState<ParsedTenderData>({})
  const [formData, setFormData] = useState<ParsedTenderData>({})
  const [documentCount, setDocumentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  const [isReparsing, setIsReparsing] = useState(false)

  // Form field configuration
  const formFields: FormField[] = [
    {
      key: 'title',
      label: 'Tender Title',
      type: 'text',
      required: true,
      icon: FileText,
      placeholder: 'Enter tender title',
      description: 'The main title or name of the tender opportunity'
    },
    {
      key: 'issuing_authority',
      label: 'Issuing Authority',
      type: 'text',
      required: true,
      icon: Building2,
      placeholder: 'Enter issuing organization name',
      description: 'The organization or authority issuing this tender'
    },
    {
      key: 'deadline',
      label: 'Submission Deadline',
      type: 'date',
      required: true,
      icon: Calendar,
      placeholder: 'Select deadline date',
      description: 'The final date and time for tender submission'
    },
    {
      key: 'contract_value',
      label: 'Contract Value (£)',
      type: 'currency',
      required: false,
      icon: PoundSterling,
      placeholder: 'Enter estimated contract value',
      description: 'The estimated total value of the contract'
    },
    {
      key: 'region',
      label: 'Region/Location',
      type: 'text',
      required: false,
      icon: MapPin,
      placeholder: 'Enter service delivery region',
      description: 'The geographic area where services will be delivered'
    },
    {
      key: 'description',
      label: 'Tender Description',
      type: 'textarea',
      required: false,
      icon: FileText,
      placeholder: 'Enter brief description of the tender requirements',
      description: 'A summary of what services or goods are being procured'
    }
  ]

  useEffect(() => {
    const dataParam = searchParams.get('data')
    const countParam = searchParams.get('documentCount')
    
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam))
        setParsedData(decoded)
        setFormData(decoded)
        setDocumentCount(parseInt(countParam || '0'))
      } catch (err) {
        console.error('Error parsing URL data:', err)
        setError('Invalid data received from document processing')
      }
    } else {
      setError('No parsed data available. Please go back and upload documents first.')
    }
  }, [searchParams])

  const handleFieldChange = (field: keyof ParsedTenderData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setModifiedFields(prev => new Set([...prev, field]))
    setError(null)
  }

  const getConfidenceLevel = (field: keyof ParsedTenderData): 'high' | 'medium' | 'low' => {
    const baseConfidence = parsedData.confidence_score || 75
    const fieldValue = parsedData[field]
    
    if (!fieldValue) return 'low'
    
    // Adjust confidence based on field completeness and data quality
    if (field === 'title' && typeof fieldValue === 'string' && fieldValue.length > 10) {
      return baseConfidence > 80 ? 'high' : 'medium'
    }
    if (field === 'deadline' && fieldValue) {
      return baseConfidence > 70 ? 'high' : 'medium'
    }
    if (field === 'contract_value' && typeof fieldValue === 'number' && fieldValue > 0) {
      return baseConfidence > 85 ? 'high' : 'medium'
    }
    
    return baseConfidence > 75 ? 'medium' : 'low'
  }

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const config = {
      high: { variant: 'default' as const, text: 'High Confidence', color: 'text-green-600' },
      medium: { variant: 'secondary' as const, text: 'Medium Confidence', color: 'text-yellow-600' },
      low: { variant: 'outline' as const, text: 'Low Confidence', color: 'text-red-600' }
    }
    
    return (
      <Badge variant={config[confidence].variant} className="ml-2">
        <Sparkles className="h-3 w-3 mr-1" />
        {config[confidence].text}
      </Badge>
    )
  }

  const handleReparse = async () => {
    setIsReparsing(true)
    // Simulate re-parsing - in real implementation, this would call the AI service again
    setTimeout(() => {
      setIsReparsing(false)
      // Could potentially update parsed data with new results
    }, 3000)
  }

  const validateForm = (): boolean => {
    const requiredFields = formFields.filter(field => field.required)
    for (const field of requiredFields) {
      const value = formData[field.key]
      if (!value || (typeof value === 'string' && !value.trim())) {
        setError(`${field.label} is required`)
        return false
      }
    }
    return true
  }

  const handleCreateProposal = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        title: formData.title,
        issuing_authority: formData.issuing_authority,
        deadline: formData.deadline,
        contract_value: formData.contract_value,
        region: formData.region,
        description: formData.description,
        workflow_type: 'auto_parsed',
        parsed_metadata: {
          evaluation_criteria: parsedData.evaluation_criteria || [],
          compliance_requirements: parsedData.compliance_requirements || [],
          key_dates: parsedData.key_dates || [],
          extraction_confidence: parsedData.confidence_score || 75,
          document_count: documentCount,
          modified_fields: Array.from(modifiedFields)
        }
      }

      const response = await fetch('/api/tender/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create proposal')
      }

      const data = await response.json()
      
      // Redirect to the tender workflow with the new ID
      router.push(`/tender-details/${data.tender_id}`)
      
    } catch (err) {
      console.error('Error creating proposal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create proposal')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 16) // Format for datetime-local input
    } catch {
      return ''
    }
  }

  const formatCurrencyValue = (value: number | undefined): string => {
    if (!value) return ''
    return value.toString()
  }

  const overallConfidence = parsedData.confidence_score || 0
  const hasAnyData = Object.values(parsedData).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  if (!hasAnyData && !error) {
    return (
      <AuthenticatedLayout className="bg-gray-50">
        <div className="min-h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Loading extracted data...</h2>
            <p className="text-gray-600">Please wait while we prepare your tender information.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    )
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
                  href="/proposals/create/upload"
                  className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Upload
                </Link>
              </div>
              <div className="mt-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Review Extracted Information
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Review and edit the information extracted from {documentCount} document{documentCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Summary */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-teal-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      AI Extraction Confidence:
                    </span>
                    <Progress 
                      value={overallConfidence} 
                      className="w-24 h-2 ml-3"
                    />
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {overallConfidence}%
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReparse}
                  disabled={isReparsing}
                  className="flex items-center"
                >
                  {isReparsing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isReparsing ? 'Re-parsing...' : 'Re-parse Documents'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 text-teal-600 mr-2" />
                  Tender Information
                </CardTitle>
                <CardDescription>
                  Review and edit the basic tender details extracted by AI. Fields marked with confidence indicators show how certain our AI is about the extracted data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formFields.map((field) => {
                  const confidence = getConfidenceLevel(field.key)
                  const isModified = modifiedFields.has(field.key)
                  const IconComponent = field.icon

                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label 
                          htmlFor={field.key} 
                          className="text-sm font-medium text-gray-700 flex items-center"
                        >
                          <IconComponent className="h-4 w-4 mr-2 text-gray-400" />
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        
                        <div className="flex items-center">
                          {isModified && (
                            <Badge variant="outline" className="mr-2">
                              <Eye className="h-3 w-3 mr-1" />
                              Modified
                            </Badge>
                          )}
                          {parsedData[field.key] && getConfidenceBadge(confidence)}
                        </div>
                      </div>

                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.key}
                          value={(formData[field.key] as string) || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                          className={`${
                            isModified ? 'border-blue-300 bg-blue-50' : ''
                          } ${
                            confidence === 'low' ? 'border-yellow-300 bg-yellow-50' : ''
                          }`}
                        />
                      ) : field.type === 'date' ? (
                        <Input
                          id={field.key}
                          type="datetime-local"
                          value={formatDateForInput(formData[field.key] as string)}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={`${
                            isModified ? 'border-blue-300 bg-blue-50' : ''
                          } ${
                            confidence === 'low' ? 'border-yellow-300 bg-yellow-50' : ''
                          }`}
                        />
                      ) : field.type === 'currency' ? (
                        <Input
                          id={field.key}
                          type="number"
                          step="0.01"
                          min="0"
                          value={formatCurrencyValue(formData[field.key] as number)}
                          onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || undefined)}
                          placeholder={field.placeholder}
                          className={`${
                            isModified ? 'border-blue-300 bg-blue-50' : ''
                          } ${
                            confidence === 'low' ? 'border-yellow-300 bg-yellow-50' : ''
                          }`}
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type="text"
                          value={(formData[field.key] as string) || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className={`${
                            isModified ? 'border-blue-300 bg-blue-50' : ''
                          } ${
                            confidence === 'low' ? 'border-yellow-300 bg-yellow-50' : ''
                          }`}
                        />
                      )}

                      {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Additional Extracted Information */}
            {(parsedData.evaluation_criteria?.length || parsedData.compliance_requirements?.length || parsedData.key_dates?.length) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 text-teal-600 mr-2" />
                    Additional Extracted Information
                  </CardTitle>
                  <CardDescription>
                    Additional details extracted from your tender documents that will be available in the full workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {parsedData.evaluation_criteria && parsedData.evaluation_criteria.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Evaluation Criteria</h4>
                      <div className="space-y-2">
                        {parsedData.evaluation_criteria.map((criteria, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{criteria.criteria}</span>
                            <Badge variant="secondary">{criteria.weight}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedData.compliance_requirements && parsedData.compliance_requirements.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Compliance Requirements</h4>
                      <div className="space-y-2">
                        {parsedData.compliance_requirements.map((requirement, index) => (
                          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{requirement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedData.key_dates && parsedData.key_dates.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Key Dates</h4>
                      <div className="space-y-2">
                        {parsedData.key_dates.map((date, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{date.description}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(date.date).toLocaleDateString('en-GB', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/proposals/create/upload">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload
                </Link>
              </Button>
              
              <Button
                onClick={handleCreateProposal}
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    Create Proposal
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 
