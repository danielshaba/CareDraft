'use client'

import { UserLifecycleManager } from '@/components/user-management/UserLifecycleManager'

export default function UserLifecyclePage() {
  return (
    <div className="container mx-auto py-6">
      <UserLifecycleManager />
    </div>
  )
}

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic' 