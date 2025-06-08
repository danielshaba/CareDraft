import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Mail, MessageCircle, FileText, ArrowLeft } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions and get assistance with CareDraft
          </p>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Learn the basics of using CareDraft
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Creating your first proposal</li>
                <li>• Understanding the dashboard</li>
                <li>• Managing your account</li>
                <li>• Using the research tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-green-600" />
                FAQ
              </CardTitle>
              <CardDescription>
                Frequently asked questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• How do I reset my password?</li>
                <li>• Can I collaborate with my team?</li>
                <li>• What file formats are supported?</li>
                <li>• How do I export my proposals?</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Get in touch with our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Need personalized assistance? Our support team is here to help.
              </p>
              <Button className="w-full" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Help Sections */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with CareDraft</CardTitle>
              <CardDescription>
                Your complete guide to using CareDraft effectively
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Create Your First Proposal</h3>
                <p className="text-gray-600">
                  Navigate to your dashboard and click "Create New Proposal" to get started. 
                  Choose from our templates or start from scratch.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Use the Research Tools</h3>
                <p className="text-gray-600">
                  Access our knowledge hub to research best practices, compliance requirements, 
                  and industry standards relevant to your proposal.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Collaborate with Your Team</h3>
                <p className="text-gray-600">
                  Invite team members to collaborate on proposals, share feedback, 
                  and track changes in real-time.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">How do I reset my password?</h3>
                <p className="text-gray-600">
                  Go to the login page and click "Forgot Password". Enter your email address 
                  and we'll send you a reset link.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Can I collaborate with my team?</h3>
                <p className="text-gray-600">
                  Yes! You can invite team members to your organization and assign different 
                  roles and permissions based on their responsibilities.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What file formats are supported?</h3>
                <p className="text-gray-600">
                  CareDraft supports PDF, DOC, DOCX, and TXT files for document upload and analysis. 
                  Proposals can be exported in PDF and DOCX formats.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">How do I export my proposals?</h3>
                <p className="text-gray-600">
                  Once your proposal is complete, use the export button in the proposal editor 
                  to download it in your preferred format.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Our support team is ready to assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Live Chat
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Response time: Usually within 24 hours
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 