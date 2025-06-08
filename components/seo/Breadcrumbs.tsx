import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { generateBreadcrumbSchema } from '@/lib/services/seo-service';

export interface BreadcrumbItem {
  name: string;
  url: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const breadcrumbSchema = generateBreadcrumbSchema(items);

  return (
    <>
      <BreadcrumbJsonLd breadcrumbs={breadcrumbSchema} />
      <nav 
        className={`flex ${className}`} 
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon 
                  className="h-4 w-4 text-gray-400 mx-2" 
                  aria-hidden="true" 
                />
              )}
              {item.current ? (
                <span 
                  className="text-sm font-medium text-gray-500"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Common breadcrumb patterns
export const breadcrumbPatterns = {
  dashboard: (): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard', current: true }
  ],

  draftBuilder: (proposalTitle?: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: proposalTitle || 'Draft Builder', url: '/draft-builder', current: true }
  ],

  knowledgeHub: (documentTitle?: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Knowledge Hub', url: '/knowledge-hub' },
    ...(documentTitle ? [{ name: documentTitle, url: '#', current: true }] : [])
  ],

  researchSessions: (sessionTitle?: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Research Sessions', url: '/research-sessions' },
    ...(sessionTitle ? [{ name: sessionTitle, url: '#', current: true }] : [])
  ],

  brainstorm: (): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Brainstorm', url: '/brainstorm', current: true }
  ],

  extract: (): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Document Extract', url: '/extract', current: true }
  ],

  answerBank: (): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Answer Bank', url: '/answer-bank', current: true }
  ],

  tenderDetails: (tenderTitle?: string): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Tenders', url: '/tenders' },
    ...(tenderTitle ? [{ name: tenderTitle, url: '#', current: true }] : [])
  ],

  compliance: (): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Compliance Check', url: '/compliance', current: true }
  ],

  userManagement: (): BreadcrumbItem[] => [
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Settings', url: '/settings' },
    { name: 'User Management', url: '/settings/users', current: true }
  ]
}; 