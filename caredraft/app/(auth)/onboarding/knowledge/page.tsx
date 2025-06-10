'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Building2,
  FileText,
  Upload, 
  ArrowLeft, 
  ArrowRight,
  FolderOpen,
  Shield,
  DollarSign,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  BookOpen,
  Lightbulb,
  Target
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { KnowledgeBaseUpload } from '@/components/shared/FileUpload'
import CareDraftLogo from '@/components/ui/CareDraftLogo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

// Document categories with their specific requirements
const DOCUMENT_CATEGORIES = {
  WINNING_BIDS: {
    title: 'Winning Bids & Case Studies',
    description: 'Upload your most successful tender responses and case studies',
    icon: Award,
    color: 'bg-emerald-500',
    maxFiles: 5,
    acceptedTypes: ['.pdf', '.docx', '.doc', '.pptx', '.ppt'],
    examples: [
      'Previous winning tender submissions',
      'Case studies of successful projects',
      'Client testimonials and references',
      'Project outcomes and achievements'
    ],
    impact: 'These documents help CareDraft understand your proven track record and successful approaches.'
  },
  POLICY_DOCUMENTS: {
    title: 'Policy & Compliance Documents',
    description: 'Upload your key organizational policies and compliance documents',
    icon: Shield,
    color: 'bg-brand-500',
    maxFiles: 10,
    acceptedTypes: ['.pdf', '.docx', '.doc'],
    examples: [
      'CQC handbook and policies',
      'TUPE policy and procedures',
      'GDPR data protection policy',
      'Modern Slavery statements',
      'Safeguarding policies',
      'Health & Safety policies',
      'Quality assurance procedures'
    ],
    impact: 'Policy documents ensure your tender responses demonstrate full compliance and best practices.'
  },
  PRICING_TEMPLATES: {
    title: 'Pricing Templates & Financial Models',
    description: 'Upload your pricing strategies and financial calculation templates',
    icon: DollarSign,
    color: 'bg-amber-500',
    maxFiles: 5,
    acceptedTypes: ['.xlsx', '.xls', '.docx', '.doc'],
    examples: [
      'Service pricing models',
      'Cost calculation templates',
      'Rate cards and fee structures',
      'Financial assumptions and methodologies',
      'Budget templates'
    ],
    impact: 'Pricing templates enable accurate and competitive financial proposals tailored to each opportunity.'
  }
} as const

type CategoryKey = keyof typeof DOCUMENT_CATEGORIES

interface CategoryUploadSectionProps {
  category: CategoryKey
  categoryData: typeof DOCUMENT_CATEGORIES[CategoryKey]
  uploadedFiles: Record<CategoryKey, string[]>
  onFilesUploaded: (category: CategoryKey, filePaths: string[]) => void
}

function CategoryUploadSection({ 
  category, 
  categoryData, 
  uploadedFiles, 
  onFilesUploaded 
}: CategoryUploadSectionProps) {
  const { title, description, icon: Icon, color, maxFiles, acceptedTypes, examples, impact } = categoryData
  const currentFiles = uploadedFiles[category] || []
  const remainingSlots = maxFiles - currentFiles.length

  const handleUploadComplete = (filePath: string) => {
    const newFiles = [...currentFiles, filePath]
    onFilesUploaded(category, newFiles)
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: color.replace('bg-', '') }}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            <CardDescription className="text-gray-600 mb-3">
              {description}
            </CardDescription>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="outline" className="text-sm">
                {currentFiles.length} / {maxFiles} files uploaded
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {acceptedTypes.join(', ')}
              </Badge>
            </div>
            {currentFiles.length > 0 && (
              <Progress 
                value={(currentFiles.length / maxFiles) * 100} 
                className="h-2 mb-4"
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <KnowledgeBaseUpload
            maxFiles={remainingSlots}
            accept={acceptedTypes.join(',')}
            onUploadComplete={handleUploadComplete}
            disabled={remainingSlots <= 0}
            className={remainingSlots <= 0 ? 'opacity-50' : ''}
          />
          
          {remainingSlots <= 0 && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Maximum files reached for this category</span>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gray-600" />
            Suggested Documents
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {examples.map((example, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Impact Statement */}
        <div className="bg-brand-50 rounded-lg p-4">
          <h4 className="font-medium text-brand-900 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-600" />
            How This Helps
          </h4>
          <p className="text-sm text-brand-700">{impact}</p>
        </div>

        {/* Current Files List */}
        {currentFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Uploaded Files ({currentFiles.length})
            </h4>
            <div className="space-y-2">
              {currentFiles.map((filePath, index) => (
                <div key={index} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">{filePath.split('/').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function OnboardingKnowledgePage() {
  const router = useRouter()
  const { companyBasicInfo } = useOnboardingStore()
  
  // Track uploaded files by category
  const [uploadedFiles, setUploadedFiles] = useState<Record<CategoryKey, string[]>>({
    WINNING_BIDS: [],
    POLICY_DOCUMENTS: [],
    PRICING_TEMPLATES: []
  })

  const handleFilesUploaded = (category: CategoryKey, filePaths: string[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [category]: filePaths
    }))
  }

  const getTotalFiles = () => {
    return Object.values(uploadedFiles).reduce((total, files) => total + files.length, 0)
  }

  const getCompletionPercentage = () => {
    const totalPossibleFiles = Object.values(DOCUMENT_CATEGORIES).reduce(
      (total, category) => total + category.maxFiles, 
      0
    )
    return Math.round((getTotalFiles() / totalPossibleFiles) * 100)
  }

  const canProceed = () => {
    // Allow proceeding even with no files (optional step)
    return true
  }

  const handleContinue = () => {
    // Store the uploaded files in the onboarding store if needed
    router.push('/onboarding/team-setup')
  }

  const handleSkip = () => {
    router.push('/onboarding/team-setup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-white to-brand-light py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/dashboard" className="inline-block mb-6">
              <CareDraftLogo />
            </Link>
            
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Seed Your Knowledge Hub
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Upload your key documents to build {companyBasicInfo?.name || 'your company'}&apos;s intelligent knowledge base. 
                This step is optional but helps CareDraft create more accurate and personalized tender responses.
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-100 rounded-full">
                <BookOpen className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-700">Step 3 of 6: Knowledge Seeding</span>
              </div>
              {getTotalFiles() > 0 && (
                <Badge variant="outline" className="bg-white">
                  {getTotalFiles()} files uploaded ({getCompletionPercentage()}% complete)
                </Badge>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Overview Info */}
            <Card className="bg-gradient-to-r from-brand-50 to-indigo-50 border-brand-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-900">
                  <Info className="h-5 w-5 text-brand-600" />
                  How Knowledge Seeding Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-brand-800">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-brand-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-brand-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Upload Documents</h3>
                    <p className="text-sm">Securely upload your key business documents</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-brand-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-brand-600" />
                    </div>
                    <h3 className="font-semibold mb-1">AI Processing</h3>
                    <p className="text-sm">Our AI extracts key insights and best practices</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-brand-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-brand-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Smart Suggestions</h3>
                    <p className="text-sm">Get personalized content for future tenders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Sections */}
            <div className="space-y-8">
              {(Object.keys(DOCUMENT_CATEGORIES) as CategoryKey[]).map((category) => (
                <CategoryUploadSection
                  key={category}
                  category={category}
                  categoryData={DOCUMENT_CATEGORIES[category]}
                  uploadedFiles={uploadedFiles}
                  onFilesUploaded={handleFilesUploaded}
                />
              ))}
            </div>

            {/* Security Notice */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Your Data is Secure</h4>
                    <p className="text-sm text-green-700">
                      All documents are encrypted in transit and at rest. Only your organization can access these files, 
                      and they&apos;re used solely to improve your tender response quality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Company Profile
              </Button>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-600"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!canProceed()}
                  className="bg-brand-primary hover:bg-brand-dark text-white flex items-center gap-2"
                >
                  Continue to Team Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 