'use client'

import React from 'react'
import { UserPresence, getUserColor, getUserDisplayName, formatTimeAgo } from '@/types/collaboration'
import { Users, Eye, Edit3 } from 'lucide-react'

interface UserPresenceIndicatorProps {
  presences: UserPresence[]
  className?: string
  showDetails?: boolean
}

export function UserPresenceIndicator({ 
  presences, 
  className = '',
  showDetails = false
}: UserPresenceIndicatorProps) {
  const activeUsers = presences.filter(p => p.is_active)

  if (presences.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Active user count */}
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <span>{activeUsers.length} active</span>
      </div>

      {/* User avatars */}
      <div className="flex -space-x-2">
        {presences.slice(0, 5).map(presence => (
          <UserAvatar
            key={presence.user_id}
            presence={presence}
            showDetails={showDetails}
          />
        ))}
        
        {presences.length > 5 && (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{presences.length - 5}
            </div>
          </div>
        )}
      </div>

      {/* Detailed list (optional) */}
      {showDetails && (
        <div className="ml-4 space-y-1">
          {presences.map(presence => (
            <UserPresenceDetail
              key={presence.user_id}
              presence={presence}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface UserAvatarProps {
  presence: UserPresence
  showDetails?: boolean
}

function UserAvatar({ presence, showDetails }: UserAvatarProps) {
  const color = getUserColor(presence.user_id)
  const displayName = getUserDisplayName(presence.user || {})
  const initials = getInitials(displayName)

  return (
    <div className="relative group">
      <div
        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white ${
          presence.is_active ? 'ring-2 ring-green-400' : 'opacity-60'
        }`}
        style={{ backgroundColor: color }}
        title={`${displayName}${presence.is_active ? ' (active)' : ' (away)'}`}
      >
        {initials}
      </div>

      {/* Activity indicator */}
      <div
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          presence.is_active ? 'bg-green-400' : 'bg-gray-400'
        }`}
      />

      {/* Tooltip */}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
          <div>{displayName}</div>
          <div className="text-gray-300">
            {presence.is_active ? 'Active now' : `Last seen ${formatTimeAgo(presence.last_seen)}`}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

interface UserPresenceDetailProps {
  presence: UserPresence
}

function UserPresenceDetail({ presence }: UserPresenceDetailProps) {
  const color = getUserColor(presence.user_id)
  const displayName = getUserDisplayName(presence.user || {})

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-medium">{displayName}</span>
      <div className="flex items-center space-x-1 text-gray-500">
        {presence.is_active ? (
          <>
            <Edit3 className="w-3 h-3" />
            <span>editing</span>
          </>
        ) : (
          <>
            <Eye className="w-3 h-3" />
            <span>away</span>
          </>
        )}
        <span>•</span>
        <span>{formatTimeAgo(presence.last_seen)}</span>
      </div>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
} 