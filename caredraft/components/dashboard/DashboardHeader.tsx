'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/MinimalAuthProvider'

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      router.push('/')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 rounded-lg p-1 -m-1">
              <div className="h-8 w-8">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <rect width="48" height="48" rx="8" fill="#2A6F6F"/>
                  <rect x="8" y="12" width="32" height="2" rx="1" fill="#E8F5F5"/>
                  <rect x="8" y="18" width="24" height="2" rx="1" fill="#E8F5F5"/>
                  <rect x="8" y="24" width="28" height="2" rx="1" fill="#E8F5F5"/>
                  <rect x="8" y="30" width="20" height="2" rx="1" fill="#E8F5F5"/>
                  <rect x="8" y="36" width="32" height="2" rx="1" fill="#E8F5F5"/>
                  <path d="M40 0L48 8V6C48 2.68629 45.3137 0 42 0H40Z" fill="#1F4F4F"/>
                  <path d="M40 0V6C40 7.10457 40.8954 8 42 8H48L40 0Z" fill="#F0F9F9"/>
                  <g transform="translate(32, 28)">
                    <path d="M8 2L9 6L13 8L9 10L8 14L7 10L3 8L7 6L8 2Z" fill="#F0F9F9"/>
                    <circle cx="2" cy="4" r="1" fill="#F0F9F9"/>
                    <circle cx="15" cy="12" r="0.8" fill="#F0F9F9"/>
                  </g>
                </svg>
              </div>
              <h1 className="text-teal-600 font-bold text-xl font-sans">CareDraft</h1>
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-gray-700">{user?.email || 'User'}</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 