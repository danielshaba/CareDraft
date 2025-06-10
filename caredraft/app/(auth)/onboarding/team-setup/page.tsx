'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Trash2, 
  Building2, 
  Mail, 
  Shield,
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Loader2,
  UserPlus
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import CareDraftLogo from '@/components/ui/CareDraftLogo'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

// Types for team management
interface InvitationRequest {
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'writer' | 'viewer'
  department: string
  message?: string
}

// Role definitions with permissions
const ROLE_DEFINITIONS = {
  admin: {
    label: 'Administrator',
    description: 'Full system access and user management',
    color: 'bg-red-500',
    permissions: [
      'Manage all proposals and workflows',
      'Invite and manage team members', 
      'Configure organization settings',
      'Access all documents and data',
      'View audit logs and analytics'
    ]
  },
  manager: {
    label: 'Manager',
    description: 'Team management and proposal oversight',
    color: 'bg-brand-500',
    permissions: [
      'Approve and review proposals',
      'Assign tasks to team members',
      'Access team performance analytics',
      'Manage department workflows'
    ]
  },
  writer: {
    label: 'Writer',
    description: 'Create and edit proposal content',
    color: 'bg-green-500',
    permissions: [
      'Create and edit proposals',
      'Access knowledge base resources', 
      'Collaborate on assigned sections',
      'Submit work for review'
    ]
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to assigned content',
    color: 'bg-gray-500',
    permissions: [
      'View assigned proposals',
      'Access shared documents',
      'Receive notifications',
      'Export approved content'
    ]
  }
} as const

// Validation schema
const teamSetupSchema = z.object({
  invitations: z.array(z.object({
    email: z.string().email('Please enter a valid email address'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['admin', 'manager', 'writer', 'viewer']),
    department: z.string().min(1, 'Department is required'),
    message: z.string().optional()
  })),
  departments: z.array(z.string().min(1, 'Department name is required')),
  maxTeamSize: z.number().min(1).max(100)
})

type TeamSetupForm = z.infer<typeof teamSetupSchema>

export default function OnboardingTeamSetupPage() {
  const router = useRouter()
  const { companyBasicInfo } = useOnboardingStore()
  const [isLoading, setIsLoading] = useState(false)
  const [invitationsSent, setInvitationsSent] = useState(0)

  const form = useForm<TeamSetupForm>({
    resolver: zodResolver(teamSetupSchema),
    defaultValues: {
      invitations: [
        { email: '', fullName: '', role: 'writer', department: 'Operations', message: '' }
      ],
      departments: ['Operations', 'Quality', 'Finance'],
      maxTeamSize: 10
    }
  })

  const { fields: invitationFields, append: appendInvitation, remove: removeInvitation } = useFieldArray({
    control: form.control,
    name: 'invitations'
  })

  const handleSendInvitations = async (data: TeamSetupForm) => {
    setIsLoading(true)
    try {
      // Send invitation emails
      for (const invitation of data.invitations) {
        if (invitation.email && invitation.fullName) {
          await sendTeamInvitation(invitation)
          setInvitationsSent(prev => prev + 1)
        }
      }
      
      // Navigate to next step
      router.push('/onboarding/tutorial')
    } catch (error) {
      console.error('Error sending invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendTeamInvitation = async (invitation: InvitationRequest) => {
    // TODO: Implement actual email invitation logic
    console.log('Sending invitation to:', invitation)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const addNewInvitation = () => {
    appendInvitation({ 
      email: '', 
      fullName: '', 
      role: 'writer', 
      department: form.watch('departments')[0] || 'Operations', 
      message: '' 
    })
  }

  const addNewDepartment = () => {
    const departments = form.watch('departments')
    const newDepartment = `Department ${departments.length + 1}`
    form.setValue('departments', [...departments, newDepartment])
  }

  const removeDepartment = (index: number) => {
    const departments = form.watch('departments')
    if (departments.length > 1) {
      form.setValue('departments', departments.filter((_, i) => i !== index))
    }
  }

  const progress = (invitationFields.filter(f => f.email && f.fullName).length / (form.watch('maxTeamSize') || 10)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-white to-brand-light py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm font-semibold">
                  4
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Team Setup & Permissions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Invite your team members and configure roles for {companyBasicInfo?.name || 'your organization'}.
              Set up departments and permissions to get everyone collaborating effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Team Progress */}
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Team Building Progress</h3>
                      <p className="text-sm text-gray-600">
                        {invitationFields.filter(f => f.email && f.fullName).length} of {form.watch('maxTeamSize')} members
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brand-primary">{Math.round(progress)}%</div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3" />
                </CardContent>
              </Card>

              {/* Invite Team Members */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-brand-primary" />
                    <span>Invite Team Members</span>
                  </CardTitle>
                  <CardDescription>
                    Send email invitations to your team members with appropriate roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(handleSendInvitations)} className="space-y-6">
                    
                    {/* Department Management */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Departments & Teams</Label>
                      <div className="space-y-2">
                        {form.watch('departments').map((dept, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={dept}
                              onChange={(e) => {
                                const departments = form.watch('departments')
                                const newDepartments = [...departments]
                                newDepartments[index] = e.target.value
                                form.setValue('departments', newDepartments)
                              }}
                              placeholder="Department name"
                              className="flex-1"
                            />
                            {form.watch('departments').length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeDepartment(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addNewDepartment}
                          className="w-full"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Department
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Team Invitations */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Team Invitations</Label>
                      <div className="space-y-4">
                        {invitationFields.map((field, index) => (
                          <motion.div
                            key={field.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 border rounded-lg space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                Invitation #{index + 1}
                              </h4>
                              {invitationFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInvitation(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`invitations.${index}.email`}>Email Address</Label>
                                <Input
                                  {...form.register(`invitations.${index}.email`)}
                                  type="email"
                                  placeholder="john@example.com"
                                />
                                {form.formState.errors.invitations?.[index]?.email && (
                                  <p className="text-sm text-red-600 mt-1">
                                    {form.formState.errors.invitations[index]?.email?.message}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor={`invitations.${index}.fullName`}>Full Name</Label>
                                <Input
                                  {...form.register(`invitations.${index}.fullName`)}
                                  placeholder="John Doe"
                                />
                                {form.formState.errors.invitations?.[index]?.fullName && (
                                  <p className="text-sm text-red-600 mt-1">
                                    {form.formState.errors.invitations[index]?.fullName?.message}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor={`invitations.${index}.role`}>Role</Label>
                                <select
                                  {...form.register(`invitations.${index}.role`)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {Object.entries(ROLE_DEFINITIONS).map(([role, definition]) => (
                                    <option key={role} value={role}>
                                      {definition.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div>
                                <Label htmlFor={`invitations.${index}.department`}>Department</Label>
                                <select
                                  {...form.register(`invitations.${index}.department`)}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {form.watch('departments').map((dept) => (
                                    <option key={dept} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor={`invitations.${index}.message`}>
                                Personal Message (Optional)
                              </Label>
                              <Textarea
                                {...form.register(`invitations.${index}.message`)}
                                placeholder="Welcome to the team! Looking forward to working with you..."
                                rows={2}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addNewInvitation}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Another Invitation
                      </Button>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-between pt-6">
                      <Link href="/onboarding/knowledge">
                        <Button variant="outline" type="button">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Knowledge Upload
                        </Button>
                      </Link>
                      
                      <div className="flex items-center space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push('/onboarding/tutorial')}
                        >
                          Skip Team Setup
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-brand-primary hover:bg-brand-primary/90"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending Invitations...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Invitations & Continue
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Role Permissions Guide */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-brand-primary" />
                    <span>Role Permissions</span>
                  </CardTitle>
                  <CardDescription>
                    Understand what each role can do
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(ROLE_DEFINITIONS).map(([role, definition]) => (
                    <div key={role} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${definition.color}`}></div>
                        <span className="font-medium">{definition.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{definition.description}</p>
                      <div className="space-y-1">
                        {definition.permissions.slice(0, 2).map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Invitation Progress */}
              {invitationsSent > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Invitations Sent</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {invitationsSent}
                      </div>
                      <p className="text-sm text-gray-600">
                        Team invitations sent successfully
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Best Practices */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-brand-primary" />
                    <span>Best Practices</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-brand-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Start Small</p>
                        <p className="text-xs text-gray-600">Invite core team members first, expand gradually</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-brand-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Clear Roles</p>
                        <p className="text-xs text-gray-600">Assign roles based on actual responsibilities</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-brand-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Department Structure</p>
                        <p className="text-xs text-gray-600">Organize teams by function for better collaboration</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 