'use client'

import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary'
import { RealtimeNotificationProvider } from '@/components/notifications/RealtimeNotificationProvider'
import { useAuth } from '@/components/providers/MinimalAuthProvider'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  /**
   * Hide sidebar (useful for auth pages, landing page, etc.)
   */
  hideSidebar?: boolean
  /**
   * Hide top bar (useful for full-screen experiences)
   */
  hideTopBar?: boolean
  /**
   * Custom sidebar content
   */
  customSidebar?: React.ReactNode
  /**
   * Custom top bar content
   */
  customTopBar?: React.ReactNode
}

export function Layout({ 
  children, 
  className = '',
  hideSidebar = false,
  hideTopBar = false,
  customSidebar,
  customTopBar
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Handle mobile sidebar toggle
  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Close sidebar when clicking outside on mobile
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar')
      const menuButton = document.querySelector('[aria-label="Open menu"]')
      
      if (
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when sidebar is open on mobile
      document.body.classList.add('overflow-hidden', 'lg:overflow-auto')
    } else {
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto')
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto')
    }
  }, [sidebarOpen])

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <AuthErrorBoundary>
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {/* Grid Layout */}
        <div 
          className={`
            grid min-h-screen
            ${!hideSidebar && !hideTopBar ? 'lg:grid-cols-[240px_1fr] lg:grid-rows-[64px_1fr]' : ''}
            ${!hideSidebar && hideTopBar ? 'lg:grid-cols-[240px_1fr]' : ''}
            ${hideSidebar && !hideTopBar ? 'grid-rows-[64px_1fr]' : ''}
            ${hideSidebar && hideTopBar ? '' : ''}
          `}
        >
          {/* Top Bar */}
          {!hideTopBar && (
            <div className={`${!hideSidebar ? 'lg:col-span-2' : 'col-span-full'} lg:row-start-1`}>
              {customTopBar || <TopBar onMenuClick={handleMenuClick} />}
            </div>
          )}

          {/* Sidebar - Desktop */}
          {!hideSidebar && (
            <aside className="hidden lg:block lg:row-start-2 lg:col-start-1">
              {customSidebar || <Sidebar />}
            </aside>
          )}

          {/* Mobile Sidebar Overlay */}
          {!hideSidebar && (
            <>
              {/* Backdrop */}
              <div 
                className={`
                  fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200
                  ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={() => setSidebarOpen(false)}
              />
              
              {/* Mobile Sidebar */}
              <aside
                id="mobile-sidebar"
                className={`
                  fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-50 lg:hidden
                  transform transition-transform duration-200 ease-in-out
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
              >
                {customSidebar || <Sidebar />}
              </aside>
            </>
          )}

          {/* Main Content */}
          <main 
            className={`
              ${!hideSidebar ? 'lg:row-start-2 lg:col-start-2' : hideTopBar ? 'col-span-full' : 'row-start-2 col-span-full'}
              ${!hideTopBar ? 'pt-16 lg:pt-0' : ''}
              min-h-0 flex flex-col
            `}
          >
            {/* Content Container */}
            <div className="flex-1 overflow-auto">
              <div className="h-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthErrorBoundary>
  )
}

// Convenience components for common layouts

/**
 * Standard authenticated layout with sidebar and top bar
 */
export function AuthenticatedLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  const { user } = useAuth()
  
  return (
    <RealtimeNotificationProvider
      userId={user?.id}
      autoConnect={true}
      debug={false}
      showBrowserNotifications={true}
    >
      <Layout className={className}>
        {children}
      </Layout>
    </RealtimeNotificationProvider>
  )
}

/**
 * Full-screen layout without sidebar or top bar (useful for auth pages)
 */
export function FullScreenLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Layout hideSidebar hideTopBar className={className}>
      {children}
    </Layout>
  )
}

/**
 * Landing page layout with only top bar
 */
export function LandingLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Layout hideSidebar className={className}>
      {children}
    </Layout>
  )
}

/**
 * Focus mode layout without top bar (useful for document editing)
 */
export function FocusLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Layout hideTopBar className={className}>
      {children}
    </Layout>
  )
}

export default Layout 