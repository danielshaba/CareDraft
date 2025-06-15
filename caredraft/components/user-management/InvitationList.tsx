"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trash2,
  Filter,
  Users,
  Calendar,
  Eye,
  Edit,
  Crown,
  Users as UsersIcon
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { UserRole } from '@/lib/auth.types'

interface InvitationListItem {
  id: string
  email: string
  role: UserRole
  status: string
  message?: string
  inviterName: string
  organizationName: string
  expiresAt: string
  createdAt: string
  sentAt?: string
  acceptedAt?: string
  invitedBy: string
  canResend: boolean
  canCancel: boolean
  daysUntilExpiry: number
}

interface InvitationStats {
  total: number
  pending: number
  accepted: number
  expired: number
  cancelled: number
}

interface InvitationListProps {
  onInviteUser?: () => void
}

const statusOptions = [
  { value: 'all', label: 'All Invitations' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' }
]

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  resent: 'bg-sky-100 text-sky-800 border-sky-200'
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  viewer: <Eye className="h-4 w-4" />,
  writer: <Edit className="h-4 w-4" />,
  manager: <UsersIcon className="h-4 w-4" />,
  admin: <Crown className="h-4 w-4" />
}

export function InvitationList({ onInviteUser }: InvitationListProps) {
  const [invitations, setInvitations] = useState<InvitationListItem[]>([])
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0,
    cancelled: 0
  })
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const toast = useToast()

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/invitations?status=${selectedStatus}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const data = await response.json()
      
      if (data.success) {
        setInvitations(data.invitations || [])
        setStats(data.stats || stats)
      } else {
        throw new Error(data.error || 'Failed to fetch invitations')
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
      toast.error(
        'Failed to load invitations',
        error instanceof Error ? error.message : 'Please try again'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [selectedStatus])

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resend' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation')
      }

      toast.success('Invitation resent', 'The invitation has been sent again')
      fetchInvitations()
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast.error(
        'Failed to resend invitation',
        error instanceof Error ? error.message : 'Please try again'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation')
      }

      toast.success('Invitation cancelled', 'The invitation has been cancelled')
      fetchInvitations()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error(
        'Failed to cancel invitation',
        error instanceof Error ? error.message : 'Please try again'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getExpiryStatus = (invitation: InvitationListItem) => {
    if (invitation.status === 'expired') return 'Expired'
    if (invitation.daysUntilExpiry <= 0) return 'Expired'
    if (invitation.daysUntilExpiry <= 1) return 'Expires today'
    if (invitation.daysUntilExpiry <= 3) return `Expires in ${invitation.daysUntilExpiry} days`
    return `Expires ${formatDate(invitation.expiresAt)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Invitations</h2>
          <p className="text-gray-600">Manage pending and sent invitations</p>
        </div>
        <Button onClick={onInviteUser}>
          <Mail className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedStatus === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
              <p className="text-gray-600 mb-4">
                {selectedStatus === 'all' 
                  ? 'No invitations have been sent yet.'
                  : `No ${selectedStatus} invitations found.`
                }
              </p>
              {selectedStatus === 'all' && (
                <Button onClick={onInviteUser}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send First Invitation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {invitation.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{invitation.email}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {roleIcons[invitation.role]}
                            <span className="text-sm text-gray-600 capitalize">{invitation.role}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <Badge className={statusColors[invitation.status] || statusColors.pending}>
                            {invitation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Sent: {formatDate(invitation.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{getExpiryStatus(invitation)}</span>
                      </div>
                      <div>
                        <span>Invited by: {invitation.inviterName}</span>
                      </div>
                      {invitation.acceptedAt && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span>Accepted: {formatDate(invitation.acceptedAt)}</span>
                        </div>
                      )}
                    </div>

                    {invitation.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">"{invitation.message}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {invitation.canResend && (
                      <LoadingButton
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === invitation.id}
                        onClick={() => handleResendInvitation(invitation.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Resend
                      </LoadingButton>
                    )}
                    
                    {invitation.canCancel && (
                      <LoadingButton
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === invitation.id}
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </LoadingButton>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 