'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Edit3, 
  X, 
  Check, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useProfile } from '@/hooks/useProfile'
import { useProfileSync } from '@/hooks/useProfileSync'
import { useProfileValidation } from '@/hooks/useProfileValidation'
import { cn } from '@/lib/utils'

interface FieldIndicatorProps {
  source?: 'onboarding' | 'manual' | 'synced'
  isModified?: boolean
  className?: string
}

const FieldIndicator: React.FC<FieldIndicatorProps> = ({ source, isModified, className }) => {
  if (!source && !isModified) return null

  const getIndicatorContent = () => {
    if (isModified) {
      return {
        icon: <Edit3 className="w-3 h-3" />,
        text: 'Modified',
        variant: 'secondary' as const,
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      }
    }

    switch (source) {
      case 'onboarding':
        return {
          icon: <Sparkles className="w-3 h-3" />,
          text: 'Auto-filled',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'synced':
        return {
          icon: <RefreshCw className="w-3 h-3" />,
          text: 'Synced',
          variant: 'secondary' as const,
          className: 'bg-brand-100 text-brand-800 border-brand-200'
        }
      default:
        return null
    }
  }

  const indicator = getIndicatorContent()
  if (!indicator) return null

  return (
    <Badge 
      variant={indicator.variant}
      className={cn('flex items-center gap-1 text-xs', indicator.className, className)}
    >
      {indicator.icon}
      {indicator.text}
    </Badge>
  )
}

interface EditableFieldProps {
  label: string
  value: string
  field: string
  type?: 'text' | 'email' | 'tel'
  placeholder?: string
  icon?: React.ReactNode
  disabled?: boolean
  multiline?: boolean
  rows?: number
  source?: 'onboarding' | 'manual' | 'synced'
  isModified?: boolean
  onValueChange: (field: string, value: string) => void
  onEdit?: (field: string, isEditing: boolean) => void
  validation?: { isValid: boolean; error?: string }
  isEditing?: boolean
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  field,
  type = 'text',
  placeholder,
  icon,
  disabled = false,
  multiline = false,
  rows = 1,
  source,
  isModified,
  onValueChange,
  onEdit,
  validation,
  isEditing = false
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [editMode, setEditMode] = useState(isEditing)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleEdit = () => {
    setEditMode(true)
    onEdit?.(field, true)
  }

  const handleSave = () => {
    onValueChange(field, localValue)
    setEditMode(false)
    onEdit?.(field, false)
  }

  const handleCancel = () => {
    setLocalValue(value)
    setEditMode(false)
    onEdit?.(field, false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field} className="text-brand-600">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <FieldIndicator source={source} isModified={isModified} />
          {!disabled && !editMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-6 w-6 p-0 text-neutral-500 hover:text-brand-500"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="relative">
        {icon && !editMode && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-500">
            {icon}
          </div>
        )}
        
        {editMode ? (
          <div className="flex items-center gap-2">
            <InputComponent
              id={field}
              type={type}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={multiline ? rows : undefined}
              className={cn(
                "border-neutral-300 focus:border-brand-500 focus:ring-brand-500/20",
                validation && !validation.isValid && "border-red-500 focus:border-red-500"
              )}
              autoFocus
            />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <InputComponent
            id={field}
            type={type}
            value={value}
            readOnly
            placeholder={placeholder || 'Not provided'}
            rows={multiline ? rows : undefined}
            className={cn(
              "border-neutral-300 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors",
              icon && "pl-10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={!disabled ? handleEdit : undefined}
          />
        )}
      </div>
      
      {validation && !validation.isValid && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {validation.error}
        </p>
      )}
    </div>
  )
}

export default function ProfileForm() {
  const toast = useToast()
  const { 
    data: profile, 
    loading, 
    error, 
    updateProfile, 
    saving,
    lastSaved,
    conflicts 
  } = useProfile()
  
  const { 
    syncing: syncStatus, 
    syncNow: syncProfile, 
    lastSync 
  } = useProfileSync()
  
  const { 
    validation, 
    validateField, 
    getCompletionPercentage 
  } = useProfileValidation()

  const [editingFields, setEditingFields] = useState<Set<string>>(new Set())

  const handleFieldEdit = (field: string, isEditing: boolean) => {
    const newEditingFields = new Set(editingFields)
    if (isEditing) {
      newEditingFields.add(field)
    } else {
      newEditingFields.delete(field)
    }
    setEditingFields(newEditingFields)
  }

  const handleValueChange = async (field: string, value: string) => {
    if (!profile) return

    const updatedProfile = { 
      ...profile,
      [field]: value
    }

    // Validate the field
    validateField(field, value)
    
    // Update profile with auto-save
    await updateProfile(updatedProfile)
  }

  const handleSyncData = async () => {
    try {
      await syncProfile()
      toast.success(
        "Profile Synced",
        "Your profile has been updated with the latest onboarding data."
      )
    } catch (error) {
      toast.error(
        "Sync Failed",
        "There was an error syncing your profile data. Please try again."
      )
    }
  }

  const completionPercentage = profile ? getCompletionPercentage(profile) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-brand-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your profile...</span>
        </div>
      </div>
    )
  }

      if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          There was an error loading your profile: {error.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-neutral-700">No Profile Data Found</h3>
            <p className="text-neutral-500">Your profile will be created automatically when you complete onboarding.</p>
          </div>
          <Button onClick={handleSyncData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync from Onboarding
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion and Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-brand-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-brand-600">Profile Completion</h3>
                <p className="text-sm text-neutral-600">{completionPercentage}% complete</p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-neutral-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionPercentage / 100)}`}
                    className="text-brand-500 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-brand-600">{completionPercentage}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-brand-600">Data Sync</h3>
                <p className="text-sm text-neutral-600">
                  {lastSync ? `Last synced ${new Date(lastSync).toLocaleDateString()}` : 'Never synced'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncData}
                disabled={syncStatus}
                className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary hover:text-white"
              >
                {syncStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Alert */}
      {conflicts && conflicts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Data conflicts detected:</strong> Some of your profile data conflicts with recent onboarding changes. 
            Review and resolve conflicts to keep your profile up to date.
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-save Status */}
      {saving && (
        <Alert className="border-brand-200 bg-brand-50">
          <Loader2 className="h-4 w-4 text-brand-600 animate-spin" />
          <AlertDescription className="text-brand-800">
            Saving changes...
          </AlertDescription>
        </Alert>
      )}

      {lastSaved && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Changes saved {new Date(lastSaved).toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card className="border-brand-primary/20">
        <CardHeader>
          <CardTitle className="text-brand-primary-dark flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Full Name"
            value={profile.fullName || ''}
            field="fullName"
            type="text"
            placeholder="Enter your full name"
            icon={<User className="w-4 h-4" />}
            source={profile.fullName ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'fullName'),
              error: validation.errors.find(e => e.field === 'fullName')?.message
            }}
            isEditing={editingFields.has('fullName')}
          />

          <EditableField
            label="Email Address"
            value={profile.email || ''}
            field="email"
            type="email"
            placeholder="Enter your email address"
            icon={<Mail className="w-4 h-4" />}
            source={profile.email ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'email'),
              error: validation.errors.find(e => e.field === 'email')?.message
            }}
            isEditing={editingFields.has('email')}
          />

          <EditableField
            label="Phone Number"
            value={profile.phone || ''}
            field="phone"
            type="tel"
            placeholder="Enter your phone number"
            icon={<Phone className="w-4 h-4" />}
            source={profile.phone ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'phone'),
              error: validation.errors.find(e => e.field === 'phone')?.message
            }}
            isEditing={editingFields.has('phone')}
          />

          <EditableField
            label="Job Title"
            value={profile.jobTitle || ''}
            field="jobTitle"
            type="text"
            placeholder="Enter your job title"
            source={profile.jobTitle ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'jobTitle'),
              error: validation.errors.find(e => e.field === 'jobTitle')?.message
            }}
            isEditing={editingFields.has('jobTitle')}
          />

          <EditableField
            label="Location"
            value={profile.location || ''}
            field="location"
            type="text"
            placeholder="Enter your location"
            icon={<MapPin className="w-4 h-4" />}
            source={profile.location ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'location'),
              error: validation.errors.find(e => e.field === 'location')?.message
            }}
            isEditing={editingFields.has('location')}
          />

          <EditableField
            label="Bio"
            value={profile.bio || ''}
            field="bio"
            type="text"
            placeholder="Tell us about yourself"
            multiline
            rows={3}
            source={profile.bio ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'bio'),
              error: validation.errors.find(e => e.field === 'bio')?.message
            }}
            isEditing={editingFields.has('bio')}
          />
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="border-brand-primary/20">
        <CardHeader>
          <CardTitle className="text-brand-primary-dark flex items-center gap-2">
            <Building className="w-5 h-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Organization Name"
            value={profile.organization || ''}
            field="organization"
            type="text"
            placeholder="Enter your organization name"
            icon={<Building className="w-4 h-4" />}
            source={profile.organization ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'organization'),
              error: validation.errors.find(e => e.field === 'organization')?.message
            }}
            isEditing={editingFields.has('organization')}
          />

          <EditableField
            label="Organization Address"
            value={profile.organizationAddress || ''}
            field="organizationAddress"
            type="text"
            placeholder="Enter organization address"
            icon={<MapPin className="w-4 h-4" />}
            multiline
            rows={2}
            source={profile.organizationAddress ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'organizationAddress'),
              error: validation.errors.find(e => e.field === 'organizationAddress')?.message
            }}
            isEditing={editingFields.has('organizationAddress')}
          />

          <EditableField
            label="Organization Description"
            value={profile.organizationDescription || ''}
            field="organizationDescription"
            type="text"
            placeholder="Describe your organization"
            multiline
            rows={4}
            source={profile.organizationDescription ? 'onboarding' : undefined}
            onValueChange={handleValueChange}
            onEdit={handleFieldEdit}
            validation={{ 
              isValid: !validation.errors.some(e => e.field === 'organizationDescription'),
              error: validation.errors.find(e => e.field === 'organizationDescription')?.message
            }}
            isEditing={editingFields.has('organizationDescription')}
          />
        </CardContent>
      </Card>

      {/* Save Status */}
      {saving && (
        <div className="flex items-center justify-center p-4 bg-brand-primary/5 rounded-lg border border-brand-primary/20">
          <div className="flex items-center gap-3 text-brand-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving changes...</span>
          </div>
        </div>
      )}

      {lastSaved && (
        <div className="flex items-center justify-center p-2 text-sm text-neutral-600">
          <Clock className="w-4 h-4 mr-2" />
          Last saved: {new Date(lastSaved).toLocaleString()}
        </div>
      )}
    </div>
  )
} 