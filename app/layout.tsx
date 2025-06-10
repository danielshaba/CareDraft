import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { generateMetadata } from '@/lib/services/seo-service'
import { JsonLd, OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'
import { ORGANIZATION_SCHEMA, SOFTWARE_APPLICATION_SCHEMA } from '@/lib/services/seo-service'
import { generateWebsiteSchema } from '@/lib/services/seo-service'
import { SEOMonitor } from '@/components/seo/SEOMonitor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd organization={ORGANIZATION_SCHEMA} />
        <WebsiteJsonLd website={generateWebsiteSchema()} />
        <JsonLd data={SOFTWARE_APPLICATION_SCHEMA} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            {children}
            <SEOMonitor />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 