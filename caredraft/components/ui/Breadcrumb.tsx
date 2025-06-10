'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
  separator?: React.ReactNode
}

export function Breadcrumb({ 
  items, 
  className = '', 
  showHome = true,
  separator = <ChevronRight className="h-4 w-4 text-gray-400" />
}: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/dashboard', current: false }, ...items]
    : items

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isCurrent = item.current || isLast

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <span className="mx-2" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {isCurrent ? (
                <span 
                  className="text-gray-900 font-medium" 
                  aria-current="page"
                >
                  {index === 0 && showHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {index === 0 && showHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Hook to generate breadcrumbs from pathname
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const generateBreadcrumbs = React.useCallback((path: string): BreadcrumbItem[] => {
    const pathSegments = path.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    let currentPath = ''
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      currentPath += `/${segment}`
      
      // Convert segment to readable label
      let label = segment
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (l) => l.toUpperCase())
      
      // Special cases for common routes
      const labelMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'settings': 'Settings',
        'profile': 'Profile Settings',
        'organization': 'Organization',
        'proposals': 'Proposals',
        'assigned': 'Assigned to Me',
        'drafts': 'My Drafts',
        'recent': 'Recent',
        'extract': 'Extract',
        'knowledge-hub': 'Knowledge Hub',
        'answer-bank': 'Answer Bank',
        'research': 'Research',
        'search': 'Search'
      }
      
      if (labelMap[segment]) {
        label = labelMap[segment]
      }
      
      breadcrumbs.push({
        label,
        href: currentPath,
        current: i === pathSegments.length - 1
      })
    }
    
    return breadcrumbs
  }, [])
  
  return React.useMemo(() => generateBreadcrumbs(pathname), [pathname, generateBreadcrumbs])
}

export default Breadcrumb 