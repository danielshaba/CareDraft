import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, Palette, Database, Shield, Zap } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-lg text-gray-600">
            Configure your CareDraft experience and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                General
              </CardTitle>
              <CardDescription>
                Basic application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Language</h3>
                  <p className="text-sm text-gray-600">Select your preferred language</p>
                </div>
                <div className="flex items-center">
                  <div className="p-2 border border-gray-200 rounded-md bg-white min-w-32">
                    <span className="text-gray-900">English (UK)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Time Zone</h3>
                  <p className="text-sm text-gray-600">Your local time zone for dates and times</p>
                </div>
                <div className="flex items-center">
                  <div className="p-2 border border-gray-200 rounded-md bg-white min-w-32">
                    <span className="text-gray-900">GMT+0</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Date Format</h3>
                  <p className="text-sm text-gray-600">How dates are displayed</p>
                </div>
                <div className="flex items-center">
                  <div className="p-2 border border-gray-200 rounded-md bg-white min-w-32">
                    <span className="text-gray-900">DD/MM/YYYY</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-600" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of CareDraft
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-600">Choose your preferred theme</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Light</Button>
                  <Button variant="outline" size="sm">Dark</Button>
                  <Button variant="outline" size="sm">System</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Sidebar Behavior</h3>
                  <p className="text-sm text-gray-600">How the sidebar should behave</p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600">Auto-collapse</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Dense Mode</h3>
                  <p className="text-sm text-gray-600">Show more content in less space</p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                Data & Storage
              </CardTitle>
              <CardDescription>
                Manage your data and storage preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Auto-save Frequency</h3>
                  <p className="text-sm text-gray-600">How often to save your work automatically</p>
                </div>
                <div className="flex items-center">
                  <div className="p-2 border border-gray-200 rounded-md bg-white min-w-32">
                    <span className="text-gray-900">Every 30 seconds</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Document Retention</h3>
                  <p className="text-sm text-gray-600">How long to keep document versions</p>
                </div>
                <div className="flex items-center">
                  <div className="p-2 border border-gray-200 rounded-md bg-white min-w-32">
                    <span className="text-gray-900">30 days</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Storage Usage</h3>
                  <p className="text-sm text-gray-600">Current usage: 2.4 GB of 10 GB</p>
                </div>
                <Button variant="outline">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-600">Help improve CareDraft by sharing usage data</p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Session Timeout</h3>
                  <p className="text-sm text-gray-600">Automatically sign out after inactivity</p>
                </div>
                <div className="flex items-center">
                  <div className="p-2 border border-gray-200 rounded-md bg-white min-w-32">
                    <span className="text-gray-900">4 hours</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Login History</h3>
                  <p className="text-sm text-gray-600">View your recent login activity</p>
                </div>
                <Button variant="outline">
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-orange-600" />
                Advanced
              </CardTitle>
              <CardDescription>
                Advanced settings for power users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Beta Features</h3>
                  <p className="text-sm text-gray-600">Enable experimental features</p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">API Access</h3>
                  <p className="text-sm text-gray-600">Manage API keys and integrations</p>
                </div>
                <Button variant="outline">
                  Manage Keys
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Export Settings</h3>
                  <p className="text-sm text-gray-600">Download your current settings</p>
                </div>
                <Button variant="outline">
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline">
              Reset to Defaults
            </Button>
            <Button>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 