'use client'

import React from 'react'
import { 
  Download, 
  FileText, 
  Upload,
  History
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// interface ExportOption {
//   id: string
//   name: string
//   description: string
//   format: 'pdf' | 'docx' | 'html'
//   icon: React.ElementType
//   size: string
//   estimatedTime: string
// }

// interface SubmissionHistory {
//   id: string
//   version: string
//   submittedAt: string
//   submittedBy: string
//   recipient: string
//   status: 'delivered' | 'opened' | 'downloaded' | 'pending'
//   format: string
//   fileSize: string
// }

export default function TenderExportPage() {
  // const params = useParams()
  // const tenderId = params.tenderId as string

  // const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  // const [exportProgress, setExportProgress] = useState<number>(0)
  // const [isExporting, setIsExporting] = useState<boolean>(false)
  // const [includeBranding, setIncludeBranding] = useState<boolean>(true)
  // const [includeAppendices, setIncludeAppendices] = useState<boolean>(true)
  // const [watermark, setWatermark] = useState<boolean>(false)
  // const [password, setPassword] = useState<string>('')

  // const exportOptions: ExportOption[] = [
  //   {
  //     id: 'pdf',
  //     name: 'PDF Document',
  //     description: 'Professional PDF with embedded fonts and graphics',
  //     format: 'pdf',
  //     icon: FileText,
  //     size: '~2.5 MB',
  //     estimatedTime: '30 seconds'
  //   },
  //   {
  //     id: 'docx',
  //     name: 'Word Document',
  //     description: 'Editable Microsoft Word format with formatting',
  //     format: 'docx',
  //     icon: FileText,
  //     size: '~1.8 MB',
  //     estimatedTime: '45 seconds'
  //   },
  //   {
  //     id: 'html',
  //     name: 'Web Page',
  //     description: 'HTML format for web viewing and sharing',
  //     format: 'html',
  //     icon: FileText,
  //     size: '~800 KB',
  //     estimatedTime: '15 seconds'
  //   }
  // ]

  // const submissionHistory: SubmissionHistory[] = [
  //   {
  //     id: '1',
  //     version: 'v2.1',
  //     submittedAt: '2024-02-10T14:30:00Z',
  //     submittedBy: 'Sarah Johnson',
  //     recipient: 'Yorkshire Health Authority',
  //     status: 'opened',
  //     format: 'PDF',
  //     fileSize: '2.3 MB'
  //   },
  //   {
  //     id: '2',
  //     version: 'v2.0',
  //     submittedAt: '2024-02-08T16:45:00Z',
  //     submittedBy: 'Michael Chen',
  //     recipient: 'Internal Review',
  //     status: 'downloaded',
  //     format: 'DOCX',
  //     fileSize: '1.9 MB'
  //   },
  //   {
  //     id: '3',
  //     version: 'v1.5',
  //     submittedAt: '2024-02-05T11:20:00Z',
  //     submittedBy: 'Emma Williams',
  //     recipient: 'Compliance Team',
  //     status: 'delivered',
  //     format: 'PDF',
  //     fileSize: '2.1 MB'
  //   }
  // ]

  // const handleExport = async () => {
  //   setIsExporting(true)
  //   setExportProgress(0)

  //   // Simulate export progress
  //   for (let i = 0; i <= 100; i += 10) {
  //     await new Promise(resolve => setTimeout(resolve, 200))
  //     setExportProgress(i)
  //   }

  //   setIsExporting(false)
  //   // In real implementation, trigger download here
  // }

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'delivered': return <Check className="w-4 h-4 text-green-500" />
  //     case 'opened': return <Mail className="w-4 h-4 text-brand-500" />
  //     case 'downloaded': return <Download className="w-4 h-4 text-purple-500" />
  //     case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
  //     default: return <AlertCircle className="w-4 h-4 text-gray-500" />
  //   }
  // }

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'delivered': return 'bg-green-100 text-green-800'
  //     case 'opened': return 'bg-brand-100 text-brand-800'
  //     case 'downloaded': return 'bg-purple-100 text-purple-800'
  //     case 'pending': return 'bg-yellow-100 text-yellow-800'
  //     default: return 'bg-gray-100 text-gray-800'
  //   }
  // }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export & Submission</h1>
          <p className="text-gray-600 mt-1">Yorkshire Community Care Services Tender</p>
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Export Document
          </TabsTrigger>
          <TabsTrigger value="submission">
            <Upload className="w-4 h-4 mr-2" />
            Submit Tender
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Submission History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Word Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submission">
          <Card>
            <CardHeader>
              <CardTitle>Submit Tender</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Submission interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Submission history will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 