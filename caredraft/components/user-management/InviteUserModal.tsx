"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, UserPlus, Eye, Edit, Crown, Users, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { LoadingButton } from '@/components/ui/loading-button'
import type { UserRole } from '@/lib/auth.types'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
}

interface InvitationForm {
  email: string
  role: UserRole
  message: string
  customExpiryDays: number
}

const roleOptions: Array<{ value: UserRole; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view proposals and research but cannot edit',
    icon: <Eye className="h-4 w-4" />
  },
  {
    value: 'writer',
    label: 'Writer',
    description: 'Can create and edit proposals and research',
    icon: <Edit className="h-4 w-4" />
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can manage team members and approve proposals',
    icon: <Users className="h-4 w-4" />
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full access to all features and settings',
    icon: <Crown className="h-4 w-4" />
  }
]

export function InviteUserModal({ isOpen, onClose, onInviteSent }: InviteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<InvitationForm>({
    email: '',
    role: 'viewer',
    message: '',
    customExpiryDays: 7
  })
  const [errors, setErrors] = useState<Partial<Record<keyof InvitationForm, string>>>({})
  
  const toast = useToast()

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Expiry validation
    if (form.customExpiryDays < 1 || form.customExpiryDays > 30) {
      newErrors.customExpiryDays = 'Expiry must be between 1 and 30 days'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          role: form.role,
          message: form.message || undefined,
          customExpiryDays: form.customExpiryDays
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully', `An invitation has been sent to ${form.email}`)
      
      // Reset form
      setForm({
        email: '',
        role: 'viewer',
        message: '',
        customExpiryDays: 7
      })
      setErrors({})
      onClose()
      
      onInviteSent?.()
    } catch {
      console.error('Error sending invitation:', error)
      toast.error(
        'Failed to send invitation',
        error instanceof Error ? error.message : 'Please try again'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRole = roleOptions.find(option => option.value === form.role)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Mail className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invite New User</h2>
              <p className="text-sm text-gray-600">
                Send an email invitation to add a new team member to your organization.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    form.role === option.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={form.role === option.value}
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    {option.icon}
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                  {form.role === option.value && (
                    <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Expiry Days */}
          <div className="space-y-2">
            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
              Invitation Expires In (Days)
            </label>
            <input
              id="expiry"
              type="number"
              min="1"
              max="30"
              value={form.customExpiryDays}
              onChange={(e) => setForm(prev => ({ ...prev, customExpiryDays: parseInt(e.target.value, 10) || 7 }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                errors.customExpiryDays ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.customExpiryDays && (
              <p className="text-sm text-red-600">{errors.customExpiryDays}</p>
            )}
            <p className="text-xs text-gray-500">
              The invitation will expire on {new Date(Date.now() + form.customExpiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Sending..."
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </LoadingButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 