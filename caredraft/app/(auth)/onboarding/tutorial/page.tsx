'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlayCircle,
  CheckCircle2,
  Circle,
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  FileText,
  Lightbulb,
  Edit3,
  Search,
  Download,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Zap
} from 'lucide-react'



import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Logo } from '@/components/ui/Logo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

// Tutorial step icons
const STEP_ICONS = {
  'tender-details': FileText,
  'extract-demo': Search,
  'brainstorm-ideas': Lightbulb,
  'draft-builder': Edit3,
  'knowledge-research': BookOpen,
  'export-submission': Download
} as const

// Mock tutorial data for sandbox
const MOCK_TENDER = {
  name: 'Residential Care Services - Oakwood Council',
  reference: 'OC-RCS-2024-001',
  authority: 'Oakwood Council',
  deadline: new Date('2024-07-15'),
  estimatedValue: '£2.5M',
  serviceType: 'Residential Care',
  totalSections: 8,
  wordLimit: 15000
}

interface TutorialStepCardProps {
  step: any
  index: number
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}

function TutorialStepCard({ step, index, isActive, isCompleted, onClick }: TutorialStepCardProps) {
  const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS] || Circle
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer ${isActive ? 'z-10' : ''}`}
      onClick={onClick}
    >
      <Card className={`transition-all duration-200 ${
        isActive ? 'border-brand-primary shadow-lg ring-2 ring-brand-primary/20' : 
        isCompleted ? 'border-green-200 bg-green-50' : 
        'border-gray-200 hover:border-gray-300'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* Step number/status */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              isCompleted ? 'bg-green-500 text-white' :
              isActive ? 'bg-brand-primary text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            
            {/* Step icon */}
            <div className={`flex-shrink-0 p-2 rounded-lg ${
              isCompleted ? 'bg-green-100 text-green-600' :
              isActive ? 'bg-brand-light text-brand-primary' :
              'bg-gray-100 text-gray-500'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            
            {/* Step content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium truncate ${
                isActive ? 'text-brand-primary' : 'text-gray-900'
              }`}>
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {step.description}
              </p>
            </div>
            
            {/* Progress indicator */}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0"
              >
                <PlayCircle className="w-5 h-5 text-brand-primary" />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function OnboardingTutorialPage() {
  const router = useRouter()
  const { 
    tutorialProgress, 
    startTutorialStep, 
    completeTutorialStep, 
    resetTutorial,
    setTutorialProgress 
  } = useOnboardingStore()

  const [isPlaying, setIsPlaying] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(tutorialProgress.currentStepIndex)

  const currentStep = tutorialProgress.steps[currentStepIndex]
  const completedSteps = tutorialProgress.steps.filter(s => s.completed).length
  const progressPercentage = (completedSteps / tutorialProgress.steps.length) * 100

  // Auto-start if not completed
  useEffect(() => {
    if (!tutorialProgress.isCompleted && !tutorialProgress.lastPlayedAt) {
      setIsPlaying(true)
    }
  }, [tutorialProgress.isCompleted, tutorialProgress.lastPlayedAt])

  const handleStartTutorial = () => {
    setIsPlaying(true)
    startTutorialStep(currentStep.id)
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex)
    const step = tutorialProgress.steps[stepIndex]
    startTutorialStep(step.id)
    setIsPlaying(true)
  }

  const handleCompleteStep = () => {
    completeTutorialStep(currentStep.id)
    
    // Move to next step if available
    if (currentStepIndex < tutorialProgress.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      // Tutorial completed
      setIsPlaying(false)
    }
  }

  const handleResetTutorial = () => {
    resetTutorial()
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

  const handleSkipTutorial = () => {
    router.push('/onboarding/first-tender')
  }

  const handleFinishTutorial = () => {
    // Mark tutorial as completed
    setTutorialProgress({ isCompleted: true })
    router.push('/onboarding/first-tender')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-white to-brand-light py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/dashboard" className="inline-block mb-6">
              <Logo size="lg" variant="full" />
            </Link>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-semibold">
                  1
                </div>
                <div className="w-12 h-1 bg-brand-primary rounded-full"></div>
                <div className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-semibold">
                  2
                </div>
                <div className="w-12 h-1 bg-brand-primary rounded-full"></div>
                <div className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-semibold">
                  3
                </div>
                <div className="w-12 h-1 bg-brand-primary rounded-full"></div>
                <div className="flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full text-sm font-semibold">
                  4
                </div>
                <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm font-semibold">
                  5
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Interactive Quick-Start Tutorial
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn how to create winning tender responses with CareDraft's intelligent workflow. 
              Practice with a sample tender in our safe sandbox environment.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Tutorial Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Step Display */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-brand-light rounded-lg">
                        {currentStep && React.createElement(
                          STEP_ICONS[currentStep.id as keyof typeof STEP_ICONS] || Circle,
                          { className: "w-6 h-6 text-brand-primary" }
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {currentStep?.title || 'Welcome to CareDraft'}
                        </CardTitle>
                        <CardDescription>
                          Step {currentStepIndex + 1} of {tutorialProgress.steps.length}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {completedSteps}/{tutorialProgress.steps.length} Complete
                    </Badge>
                  </div>
                  <Progress value={progressPercentage} className="mt-4" />
                </CardHeader>
                <CardContent>
                  {!isPlaying ? (
                    <div className="text-center py-8">
                      <div className="mb-6">
                        <Trophy className="w-16 h-16 text-brand-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {tutorialProgress.isCompleted ? 'Tutorial Completed!' : 'Ready to Start Learning?'}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          {tutorialProgress.isCompleted 
                            ? 'Great job! You\'ve completed the tutorial and are ready to create your first real tender response.'
                            : 'Follow our guided walkthrough to learn the core CareDraft workflow using a sample tender.'
                          }
                        </p>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        {!tutorialProgress.isCompleted ? (
                          <>
                            <Button 
                              onClick={handleStartTutorial}
                              className="bg-brand-primary hover:bg-brand-primary/90"
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start Tutorial
                            </Button>
                            {tutorialProgress.lastPlayedAt && (
                              <Button 
                                variant="outline"
                                onClick={handleResetTutorial}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset Progress
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button 
                            onClick={handleFinishTutorial}
                            className="bg-brand-primary hover:bg-brand-primary/90"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Continue to Real Tender
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Sample Tender Info */}
                      <Alert className="bg-brand-50 border-brand-200">
                        <Sparkles className="h-4 w-4 text-brand-600" />
                        <AlertDescription className="text-brand-800">
                          <strong>Practice Mode:</strong> You're working with a sample tender for {MOCK_TENDER.name}. 
                          All actions are simulated and safe to explore.
                        </AlertDescription>
                      </Alert>

                      {/* Step Content */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        {currentStep && (
                          <TutorialStepContent 
                            step={currentStep} 
                            mockTender={MOCK_TENDER}
                            onComplete={handleCompleteStep}
                          />
                        )}
                      </div>

                      {/* Step Navigation */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button 
                          variant="outline"
                          onClick={() => currentStepIndex > 0 && setCurrentStepIndex(currentStepIndex - 1)}
                          disabled={currentStepIndex === 0}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                        
                        <div className="text-sm text-gray-500">
                          {currentStepIndex + 1} of {tutorialProgress.steps.length}
                        </div>
                        
                        <Button 
                          onClick={currentStep?.completed ? 
                            (currentStepIndex < tutorialProgress.steps.length - 1 ? 
                              () => setCurrentStepIndex(currentStepIndex + 1) : 
                              handleFinishTutorial
                            ) : 
                            handleCompleteStep
                          }
                          className="bg-brand-primary hover:bg-brand-primary/90"
                        >
                          {currentStep?.completed ? 
                            (currentStepIndex < tutorialProgress.steps.length - 1 ? 'Next Step' : 'Finish') :
                            'Mark Complete'
                          }
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tutorial Steps Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-brand-primary" />
                    <span>Tutorial Steps</span>
                  </CardTitle>
                  <CardDescription>
                    Complete each step to master the CareDraft workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tutorialProgress.steps.map((step, index) => (
                    <TutorialStepCard
                      key={step.id}
                      step={step}
                      index={index}
                      isActive={index === currentStepIndex}
                      isCompleted={step.completed}
                      onClick={() => handleStepClick(index)}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Sample Tender Details */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-brand-primary" />
                      <span>Sample Tender</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                  {showDetails && (
                    <CardDescription>
                      Practice with this realistic tender scenario
                    </CardDescription>
                  )}
                </CardHeader>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tender Name:</span>
                            <span className="text-sm font-medium">{MOCK_TENDER.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Reference:</span>
                            <span className="text-sm font-medium">{MOCK_TENDER.reference}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Authority:</span>
                            <span className="text-sm font-medium">{MOCK_TENDER.authority}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Value:</span>
                            <span className="text-sm font-medium">{MOCK_TENDER.estimatedValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Sections:</span>
                            <span className="text-sm font-medium">{MOCK_TENDER.totalSections}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Word Limit:</span>
                            <span className="text-sm font-medium">{MOCK_TENDER.wordLimit.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-brand-primary" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleSkipTutorial}
                    className="w-full justify-start"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Skip Tutorial
                  </Button>
                  
                  {tutorialProgress.lastPlayedAt && (
                    <Button
                      variant="outline"
                      onClick={handleResetTutorial}
                      className="w-full justify-start"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Progress
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/onboarding/team-setup')}
                    className="w-full justify-start"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Team Setup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Tutorial step content component
function TutorialStepContent({ step, mockTender, onComplete }: { 
  step: any, 
  mockTender: any, 
  onComplete: () => void 
}) {
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    // Simulate some action time
    await new Promise(resolve => setTimeout(resolve, 1000))
    onComplete()
    setIsCompleting(false)
  }

  const getStepContent = () => {
    switch (step.id) {
      case 'tender-details':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configure Tender Details</h3>
            <p className="text-gray-600">
              First, we'll set up the basic information about your tender including the issuing authority, 
              deadlines, and evaluation criteria.
            </p>
            <div className="bg-white rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Tender Name:</span>
                  <span>{mockTender.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reference:</span>
                  <span>{mockTender.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Authority:</span>
                  <span>{mockTender.authority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Estimated Value:</span>
                  <span>{mockTender.estimatedValue}</span>
                </div>
              </div>
            </div>
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                In the real workflow, you would fill out a detailed form with tender information, 
                evaluation criteria weights, and word limits for each section.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 'extract-demo':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Extract Document Information</h3>
            <p className="text-gray-600">
              Upload your tender document and let our AI extract key requirements, compliance items, 
              and evaluation criteria automatically.
            </p>
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Simulated document upload: tender-document.pdf
              </p>
            </div>
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                The AI would automatically identify sections like "Service Delivery", "Staffing Approach", 
                and "Quality Assurance" along with their word limits and requirements.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 'brainstorm-ideas':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Generate Response Ideas</h3>
            <p className="text-gray-600">
              Use AI to brainstorm content ideas for each section of your tender response. 
              Choose from Library AI, Creative AI, or Internet research.
            </p>
            <div className="space-y-3">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Sample Ideas Generated:</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Person-centered care approach with individualized support plans</li>
                  <li>• 24/7 staffing model with qualified nurses and care assistants</li>
                  <li>• Digital care management system for real-time monitoring</li>
                  <li>• Family engagement program with regular communication</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'draft-builder':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Build Your Response</h3>
            <p className="text-gray-600">
              Use the collaborative draft builder to write your tender response. Add content from brainstorming, 
              use AI assistance, and collaborate with your team.
            </p>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Section: Service Delivery Approach</span>
                <Badge variant="outline">450 / 500 words</Badge>
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                Our person-centered approach ensures that each resident receives individualized care 
                tailored to their specific needs and preferences...
              </div>
            </div>
          </div>
        )

      case 'knowledge-research':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Research Supporting Information</h3>
            <p className="text-gray-600">
              Access your Knowledge Hub to find relevant company information, policies, 
              and previous successful responses to strengthen your proposal.
            </p>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center space-x-3 mb-3">
                <BookOpen className="w-5 h-5 text-brand-500" />
                <span className="font-medium">Relevant Documents Found:</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• CQC Outstanding Rating Certificate (2023)</li>
                <li>• Staff Training and Development Policy</li>
                <li>• Previous Tender Win: Riverside Care Contract</li>
                <li>• Quality Assurance Framework</li>
              </ul>
            </div>
          </div>
        )

      case 'export-submission':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Export and Submit</h3>
            <p className="text-gray-600">
              Once your response is complete, export it to PDF or Word format, 
              submit for review, and track the submission process.
            </p>
            <div className="bg-white rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Export Options:</span>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline">PDF</Button>
                    <Button size="sm" variant="outline">Word</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className="bg-green-100 text-green-800">Ready for Submission</Badge>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Step content not found</div>
    }
  }

  return (
    <div className="space-y-6">
      {getStepContent()}
      
      <div className="pt-4 border-t">
        <Button 
          onClick={handleComplete}
          disabled={isCompleting || step.completed}
          className="w-full bg-brand-primary hover:bg-brand-primary/90"
        >
          {isCompleting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Completing...
            </>
          ) : step.completed ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Complete
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 
