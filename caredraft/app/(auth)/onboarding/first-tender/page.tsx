'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload,
  Calendar,
  Clock,
  FileText,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  Award,
  Lightbulb,
  BarChart,
  Zap,
  Star,
  Sparkles,
  User
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TenderDocumentUpload } from '@/components/shared/FileUpload'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

interface UploadedTender {
  id: string
  fileName: string
  filePath: string
  uploadedAt: Date
  processingStatus: 'pending' | 'processing' | 'completed' | 'error'
  analysis?: {
    tenderValue: string
    deadline: string
    keyRequirements: string[]
    complianceGap: number
    recommendedActions: string[]
  }
}

interface SchedulingSlot {
  id: string
  dateTime: Date
  duration: number // in minutes
  available: boolean
}

interface CSMInfo {
  name: string
  title: string
  avatar: string
  specialties: string[]
  experience: string
  successRate: string
}

export default function FirstTenderKickOffPage() {
  const router = useRouter()
  const { 
    companyBasicInfo: _companyBasicInfo, 
    companyProfile: _companyProfile,
    setCurrentStep,
    setCompletedSteps,
    completedSteps 
  } = useOnboardingStore()
  
  const [currentStage, setCurrentStage] = useState<'upload' | 'analysis' | 'scheduling' | 'recommendations' | 'completion'>('upload')
  const [uploadedTenders, setUploadedTenders] = useState<UploadedTender[]>([])
  const [_isProcessing, setIsProcessing] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SchedulingSlot | null>(null)
  const [personalMessage, setPersonalMessage] = useState('')
  const [preferredTopics, setPreferredTopics] = useState<string[]>([])
  const [isCompleting, setIsCompleting] = useState(false)

  // Mock CSM information
  const csmInfo: CSMInfo = {
    name: 'Sarah Thompson',
    title: 'Senior Customer Success Manager',
    avatar: '/api/placeholder/64/64',
    specialties: ['Care Sector Tendering', 'Compliance Strategy', 'Team Development'],
    experience: '8+ years',
    successRate: '94% client satisfaction'
  }

  // Mock available scheduling slots (next 5 business days, 9-5 PM)
  const [availableSlots, _setAvailableSlots] = useState<SchedulingSlot[]>(() => {
    const slots: SchedulingSlot[] = []
    const now = new Date()
    
    for (let day = 1; day <= 5; day++) {
      const date = new Date(now)
      date.setDate(date.getDate() + day)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      // Create slots from 9 AM to 5 PM in 30-minute intervals
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(date)
          slotTime.setHours(hour, minute, 0, 0)
          
          slots.push({
            id: `${slotTime.toISOString()}`,
            dateTime: slotTime,
            duration: 30,
            available: Math.random() > 0.3 // 70% availability
          })
        }
      }
    }
    
    return slots.filter(slot => slot.available).slice(0, 20) // Show first 20 available slots
  })

  // Discussion topics for CSM call
  const discussionTopics = [
    'Tender Strategy & Approach',
    'Team Training & Development',
    'Compliance & Quality Assurance',
    'Technology Integration',
    'Growth Planning',
    'Industry Best Practices'
  ]

  const handleTenderUpload = async (filePath: string, fileName: string) => {
    const newTender: UploadedTender = {
      id: Date.now().toString(),
      fileName,
      filePath,
      uploadedAt: new Date(),
      processingStatus: 'processing'
    }
    
    setUploadedTenders(prev => [...prev, newTender])
    setIsProcessing(true)
    
    // Simulate tender analysis processing
    setTimeout(() => {
      const analysis = {
        tenderValue: '£125,000 - £180,000',
        deadline: '14 working days',
        keyRequirements: [
          'CQC Outstanding rating required',
          'TUPE transfer compliance',
          'Local authority partnership experience',
          'Digital care platform integration'
        ],
        complianceGap: 15, // percentage
        recommendedActions: [
          'Update CQC documentation section',
          'Enhance TUPE transfer procedures',
          'Highlight recent LA partnerships',
          'Showcase CareDraft integration benefits'
        ]
      }
      
      setUploadedTenders(prev => 
        prev.map(tender => 
          tender.id === newTender.id 
            ? { ...tender, processingStatus: 'completed', analysis }
            : tender
        )
      )
      setIsProcessing(false)
      setCurrentStage('analysis')
    }, 3000)
  }

  const handleScheduleCall = () => {
    if (!selectedSlot) return
    
    // Here would be integration with calendar API
    setCurrentStage('recommendations')
  }

  const generateRecommendations = () => {
    return [
      {
        title: 'Leverage Your CQC Outstanding Rating',
        description: 'Prominently feature your regulatory excellence as a key differentiator',
        priority: 'high',
        impact: 'Increases win probability by 23%',
        timeToImplement: '2 hours'
      },
      {
        title: 'Expand Your Knowledge Hub',
        description: 'Add more policy templates and case studies based on uploaded documents',
        priority: 'medium',
        impact: 'Improves proposal quality by 18%',
        timeToImplement: '1 day'
      },
      {
        title: 'Team Training on New Features',
        description: 'Schedule training session on advanced CareDraft features',
        priority: 'medium',
        impact: 'Reduces proposal time by 35%',
        timeToImplement: '3 hours'
      },
      {
        title: 'Create Custom Templates',
        description: 'Build templates specific to your sector and successful approaches',
        priority: 'low',
        impact: 'Standardizes quality across team',
        timeToImplement: '4 hours'
      }
    ]
  }

  const completeOnboarding = async () => {
    setIsCompleting(true)
    
    // Mark onboarding as complete
    setCurrentStep(5) // Move to a completion state
    setCompletedSteps([...completedSteps, 4, 5])
    
    // Simulate transition to dashboard
    setTimeout(() => {
      router.push('/dashboard?onboarding=complete')
    }, 3000)
  }

  const formatSlotTime = (dateTime: Date) => {
    return {
      date: dateTime.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: dateTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }

  const recommendations = generateRecommendations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your First Tender Kick-Off
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let&apos;s analyze your first tender opportunity and set up your success path with expert guidance
            </p>
          </motion.div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { key: 'upload', label: 'Upload Tender', icon: Upload },
              { key: 'analysis', label: 'Analysis', icon: BarChart },
              { key: 'scheduling', label: 'Schedule Call', icon: Calendar },
              { key: 'recommendations', label: 'Recommendations', icon: Target },
              { key: 'completion', label: 'Launch!', icon: Zap }
            ].map((step, index) => {
              const isActive = currentStage === step.key
              const isCompleted = ['upload', 'analysis', 'scheduling', 'recommendations'].indexOf(currentStage) > 
                                 ['upload', 'analysis', 'scheduling', 'recommendations'].indexOf(step.key)
              const Icon = step.icon

              return (
                <React.Fragment key={step.key}>
                  <div className={`flex flex-col items-center ${
                    isActive ? 'text-brand-primary' : 
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isActive ? 'border-brand-primary bg-brand-primary-light' :
                      isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <span className="text-xs mt-1 font-medium">{step.label}</span>
                  </div>
                  {index < 4 && (
                    <div className={`h-px w-8 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Stage 1: Tender Upload */}
          {currentStage === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Your First Tender Document
                  </CardTitle>
                  <CardDescription>
                    Upload a tender document to get started with intelligent analysis and personalized recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TenderDocumentUpload
                    onUploadComplete={handleTenderUpload}
                    onUploadError={(error) => console.error('Upload error:', error)}
                    maxFiles={1}
                    className="min-h-[200px]"
                  />
                  
                  <Alert className="mt-4">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tip:</strong> Choose a recent tender document for the most relevant analysis. 
                      Supported formats: PDF, DOCX, ODT • Maximum size: 50MB
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              {/* Uploaded files list */}
              {uploadedTenders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uploadedTenders.map((tender) => (
                        <div key={tender.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-brand-600" />
                            <div>
                              <p className="font-medium">{tender.fileName}</p>
                              <p className="text-sm text-gray-500">
                                Uploaded {tender.uploadedAt.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {tender.processingStatus === 'processing' && (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full" />
                                <span className="text-sm text-gray-600">Processing...</span>
                              </>
                            )}
                            {tender.processingStatus === 'completed' && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Analysis Complete
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Stage 2: Analysis Results */}
          {currentStage === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {uploadedTenders.filter(t => t.analysis).map((tender) => (
                <div key={tender.id} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Tender Analysis: {tender.fileName}
                      </CardTitle>
                      <CardDescription>
                        AI-powered analysis of your tender opportunity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Metrics */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Key Metrics</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-brand-50 rounded-lg">
                              <span className="text-sm font-medium">Estimated Value</span>
                              <span className="font-semibold text-brand-900">{tender.analysis?.tenderValue}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                              <span className="text-sm font-medium">Submission Deadline</span>
                              <span className="font-semibold text-orange-900">{tender.analysis?.deadline}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium">Compliance Gap</span>
                              <span className="font-semibold text-green-900">{tender.analysis?.complianceGap}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Key Requirements */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Key Requirements</h4>
                          <ul className="space-y-2">
                            {tender.analysis?.keyRequirements.map((req, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Target className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Recommended Actions */}
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-4">Immediate Action Items</h4>
                        <div className="grid gap-3">
                          {tender.analysis?.recommendedActions.map((action, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                              <Lightbulb className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setCurrentStage('scheduling')}
                      size="lg"
                      className="bg-brand-primary hover:bg-brand-primary-dark"
                    >
                      Continue to Expert Consultation
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Stage 3: CSM Scheduling */}
          {currentStage === 'scheduling' && (
            <motion.div
              key="scheduling"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Your Success Call
                  </CardTitle>
                  <CardDescription>
                    Book a 30-minute consultation with your dedicated Customer Success Manager
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* CSM Information */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-brand-50 to-indigo-50 rounded-lg">
                    <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{csmInfo.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{csmInfo.title}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {csmInfo.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {csmInfo.experience}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {csmInfo.successRate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Available Time Slots</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {availableSlots.slice(0, 12).map((slot) => {
                        const { date, time } = formatSlotTime(slot.dateTime)
                        const isSelected = selectedSlot?.id === slot.id
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              isSelected 
                                ? 'border-brand-primary bg-brand-primary-light' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-sm font-medium">{date}</div>
                            <div className="text-xs text-gray-600">{time} (30 mins)</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Discussion Topics */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      What would you like to discuss? (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {discussionTopics.map((topic) => {
                        const isSelected = preferredTopics.includes(topic)
                        return (
                          <button
                            key={topic}
                            onClick={() => {
                              setPreferredTopics(prev => 
                                isSelected 
                                  ? prev.filter(t => t !== topic)
                                  : [...prev, topic]
                              )
                            }}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              isSelected 
                                ? 'border-brand-primary bg-brand-primary-light' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-sm">{topic}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Personal Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Share any specific questions or challenges you'd like to discuss..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={handleScheduleCall}
                      disabled={!selectedSlot}
                      size="lg"
                      className="bg-brand-primary hover:bg-brand-primary-dark"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stage 4: Recommendations */}
          {currentStage === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Personalized Success Recommendations
                  </CardTitle>
                  <CardDescription>
                    Based on your company profile and tender analysis, here&apos;s your roadmap to success
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                          <Badge 
                            variant={rec.priority === 'high' ? 'default' : 'secondary'}
                            className={rec.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                          >
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {rec.impact}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rec.timeToImplement}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Call Confirmation */}
              {selectedSlot && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Call Scheduled Successfully!</p>
                        <p className="text-sm text-green-700">
                          {formatSlotTime(selectedSlot.dateTime).date} at {formatSlotTime(selectedSlot.dateTime).time} with {csmInfo.name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={() => setCurrentStage('completion')}
                  size="lg"
                  className="bg-brand-primary hover:bg-brand-primary-dark"
                >
                  Complete Onboarding
                  <Zap className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Stage 5: Completion */}
          {currentStage === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8"
            >
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-8 pb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    🎉 Congratulations!
                  </h2>
                  <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                    You&apos;ve successfully completed your CareDraft onboarding. Your first tender is analyzed, 
                    your expert call is scheduled, and you&apos;re ready to win more tenders than ever before.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                    <div className="p-4 bg-white border border-green-200 rounded-lg">
                      <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Tender Analyzed</h4>
                      <p className="text-sm text-gray-600">Ready for winning proposal creation</p>
                    </div>
                    <div className="p-4 bg-white border border-green-200 rounded-lg">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Expert Support</h4>
                      <p className="text-sm text-gray-600">Success call scheduled with {csmInfo.name}</p>
                    </div>
                    <div className="p-4 bg-white border border-green-200 rounded-lg">
                      <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Success Roadmap</h4>
                      <p className="text-sm text-gray-600">Personalized recommendations ready</p>
                    </div>
                  </div>

                  <Button 
                    onClick={completeOnboarding}
                    disabled={isCompleting}
                    size="lg"
                    className="bg-brand-primary hover:bg-brand-primary-dark"
                  >
                    {isCompleting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Launching Dashboard...
                      </>
                    ) : (
                      <>
                        Launch CareDraft Dashboard
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Link
            href="/onboarding/tutorial"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tutorial
          </Link>
          
          <div className="text-sm text-gray-500">
            Step 5 of 5 - Final Step
          </div>
        </div>
      </div>
    </div>
  )
} 