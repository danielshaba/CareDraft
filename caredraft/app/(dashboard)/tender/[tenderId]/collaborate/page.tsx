'use client'

// Disable static generation for this page since it has client-side functionality
export const dynamic = 'force-dynamic'




import React, { useState } from 'react'
import { MessageSquare, CheckSquare, Clock, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TenderCollaboratePage() {
  // const params = useParams()
  // const tenderId = params.tenderId as string
  const [newComment, setNewComment] = useState('')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-600 mt-1">Yorkshire Community Care Services Tender</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks & Progress
          </TabsTrigger>
          <TabsTrigger value="discussions">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussions  
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="w-4 h-4 mr-2" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Team Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Task management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions">
          <Card>
            <CardHeader>
              <CardTitle>Team Discussions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts, ask questions, or provide updates..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button onClick={() => setNewComment('')}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Activity feed will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
