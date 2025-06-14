'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Search, 
  Settings, 
  LogOut,
  Menu, 
  ChevronDown, 
  ScanText,
  Lightbulb,
  Edit3,
  FileSearch,
  Database,
  HelpCircle,
  User
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { Logo } from '@/components/ui/Logo'

// Context and providers (removed unused imports)

interface ModuleTab {
  id: string
  label: string
  href: string
  icon: React.ElementType
  description: string
  color?: string
}

const moduleTabs: ModuleTab[] = [
  {
    id: 'extract',
    label: 'Extract',
    href: '/extract',
    icon: ScanText,
    description: 'Extract key information from tender documents',
    color: 'text-brand-500',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    href: '/brainstorm',
    icon: Lightbulb,
    description: 'Generate ideas and strategies for your bid',
    color: 'text-yellow-600',
  },
  {
    id: 'draft-builder',
    label: 'Draft Builder',
    href: '/draft-builder',
    icon: Edit3,
    description: 'Build and refine your proposal drafts',
    color: 'text-brand-600',
  },
  {
    id: 'tender-details',
    label: 'Tender Details',
    href: '/tender-details',
    icon: FileSearch,
    description: 'Manage tender requirements and specifications',
    color: 'text-purple-600',
  },
  {
    id: 'knowledge-hub',
    label: 'Knowledge Hub',
    href: '/knowledge-hub',
    icon: Database,
    description: 'Access your answer bank and research tools',
    color: 'text-brand-500',
  },
]

interface TopBarProps {
  className?: string
  onMenuClick?: () => void
}

export function TopBar({ className = '', onMenuClick }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  const profileMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCurrentModule = () => {
    return moduleTabs.find(tab => pathname.startsWith(tab.href))
  }

  const isTabActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const currentModule = getCurrentModule()

  return (
    <header className={`fixed top-0 left-0 right-0 h-topbar bg-white border-b border-neutral-200 z-40 ${className}`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Logo and Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-opacity-50"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-neutral-600" strokeWidth={2} />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-lg p-1 -m-1">
            <Logo size="sm" variant="icon-only" priority />
            <span className="text-xl font-semibold text-neutral-900 hidden sm:block font-sans">CareDraft</span>
          </Link>
        </div>

        {/* Center: Module Tabs */}
        <div className="hidden md:flex items-center space-x-1 bg-neutral-50 rounded-lg p-1">
          {moduleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = isTabActive(tab.href)
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-white text-brand-primary-500 shadow-sm'
                    : 'text-white hover:text-brand-primary-100 hover:bg-white/10'
                  }
                `}
                title={tab.description}
              >
                <Icon 
                  className={`h-4 w-4 ${isActive ? 'text-brand-primary-500' : ''}`} 
                  strokeWidth={2} 
                />
                <span className="hidden lg:block">{tab.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-brand-primary-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Current module indicator for mobile */}
        {currentModule && (
          <div className="md:hidden flex items-center space-x-2 bg-teal-50 rounded-lg px-3 py-1">
            <currentModule.icon className={`h-4 w-4 text-teal-600`} strokeWidth={2} />
            <span className="text-sm font-medium text-teal-600">{currentModule.label}</span>
          </div>
        )}

        {/* Right: Utility Icons */}
        <div className="flex items-center space-x-2">
          {/* Global Search */}
          <button
            onClick={() => router.push('/search')}
            className="p-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
            aria-label="Search"
            title="Global Search"
          >
            <Search className="h-5 w-5 text-neutral-600 hover:text-teal-600 transition-colors duration-200" strokeWidth={2} />
          </button>

          {/* Notifications */}
          {isClient && (
            <NotificationDropdown 
              size="md"
              showConnectionStatus={true}
              panelPosition="right"
              panelMaxHeight={400}
            />
          )}

          {/* Help */}
          <button
            onClick={() => router.push('/help')}
            className="p-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
            aria-label="Help"
            title="Help & Support"
          >
            <HelpCircle className="h-5 w-5 text-neutral-600 hover:text-teal-600 transition-colors duration-200" strokeWidth={2} />
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-teal-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
              aria-label="Profile menu"
            >
              <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-600 hidden sm:block" strokeWidth={2} />
            </button>

            {/* Profile dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {user?.role || 'Member'}
                  </p>
                </div>

                {/* Menu items */}
                <Link
                  href="/settings/profile"
                  className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-teal-50 hover:text-teal-600 transition-all duration-200"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="h-4 w-4 mr-3" strokeWidth={2} />
                  Profile Settings
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-teal-50 hover:text-teal-600 transition-all duration-200"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-3" strokeWidth={2} />
                  Settings
                </Link>

                <div className="border-t border-neutral-100 my-1" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    handleSignOut()
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-3" strokeWidth={2} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar 