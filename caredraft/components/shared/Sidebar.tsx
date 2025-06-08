'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, 
  Home, 
  FileText, 
  User, 
  Edit3, 
  ScanText, 
  Database, 
  Settings,
  ChevronDown,
  Folder,
  Clock
} from 'lucide-react'
import { useAuth } from '@/components/providers/MinimalAuthProvider'
import { ProtectedComponent } from '@/components/ProtectedComponent'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
  submenu?: NavigationItem[]
  requiredRole?: 'admin' | 'manager' | 'writer' | 'viewer'
  requiredPermissions?: string[]
}

const navigationItems: NavigationItem[] = [
  {
    id: 'search',
    label: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'proposals',
    label: 'Proposals',
    href: '/proposals',
    icon: FileText,
    submenu: [
      {
        id: 'all-proposals',
        label: 'All Proposals',
        href: '/proposals',
        icon: Folder,
      },
      {
        id: 'assigned-to-me',
        label: 'Assigned to Me',
        href: '/proposals/assigned',
        icon: User,
        badge: '3',
      },
      {
        id: 'my-drafts',
        label: 'My Drafts',
        href: '/proposals/drafts',
        icon: Edit3,
        badge: '2',
      },
      {
        id: 'recent',
        label: 'Recent',
        href: '/proposals/recent',
        icon: Clock,
      },
    ],
  },
  {
    id: 'extract',
    label: 'Extract',
    href: '/extract',
    icon: ScanText,
  },
  {
    id: 'knowledge-hub',
    label: 'Knowledge Hub',
    href: '/knowledge-hub',
    icon: Database,
    submenu: [
      {
        id: 'answer-bank',
        label: 'Answer Bank',
        href: '/knowledge-hub/answer-bank',
        icon: Database,
      },
      {
        id: 'research',
        label: 'Research',
        href: '/knowledge-hub/research',
        icon: Search,
        requiredPermissions: ['access_research'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    submenu: [
      {
        id: 'profile',
        label: 'Profile',
        href: '/settings/profile',
        icon: User,
      },
      {
        id: 'organization',
        label: 'Organization',
        href: '/settings/organization',
        icon: Settings,
        requiredRole: 'manager',
      },
      {
        id: 'admin',
        label: 'Admin',
        href: '/admin',
        icon: Settings,
        requiredRole: 'admin',
      },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  // Auto-expand active menu sections
  React.useEffect(() => {
    const newExpanded = new Set<string>()
    navigationItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubmenu = item.submenu.some(subitem => 
          pathname === subitem.href || pathname.startsWith(subitem.href + '/')
        )
        if (hasActiveSubmenu) {
          newExpanded.add(item.id)
        }
      }
    })
    setExpandedItems(newExpanded)
  }, [pathname])

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const Icon = item.icon
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedItems.has(item.id)
    const active = isActive(item.href)

    // Check if user has access to this item
    if (item.requiredRole || item.requiredPermissions) {
      return (
        <ProtectedComponent
          key={item.id}
          requiredRole={item.requiredRole}
          requiredPermissions={item.requiredPermissions as any}
          hideOnNoAccess={true}
        >
          {renderItemContent()}
        </ProtectedComponent>
      )
    }

    function renderItemContent() {
      return (
        <div key={item.id}>
          {hasSubmenu ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${level === 0 ? 'mb-1' : 'mb-0.5'}
                ${active
                  ? 'bg-brand-primary-light text-brand-primary-dark border-r-2 border-brand-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <Icon className="h-5 w-5 mr-3" strokeWidth={2} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-brand-primary-light text-brand-primary-dark rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronDown 
                className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </button>
          ) : (
            <Link
              href={item.href}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${level === 0 ? 'mb-1' : 'mb-0.5'}
                ${active
                  ? 'bg-brand-primary-light text-brand-primary-dark border-r-2 border-brand-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <Icon className="h-5 w-5 mr-3" strokeWidth={2} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-brand-primary-light text-brand-primary-dark rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )}

          {/* Submenu */}
          {hasSubmenu && isExpanded && (
            <div className="ml-4 mt-1 space-y-0.5">
              {item.submenu?.map(subitem => renderNavigationItem(subitem, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return renderItemContent()
  }

  return (
    <div className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-30 ${className}`}>
      {/* Logo Section */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CD</span>
          </div>
          <span className="text-xl font-bold text-gray-900">CareDraft</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role || 'Member'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map(item => renderNavigationItem(item))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          <p>CareDraft v1.0</p>
          <p>© 2024 All rights reserved</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 