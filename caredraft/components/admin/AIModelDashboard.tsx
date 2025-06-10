'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Cpu, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Zap,
  Settings,
  Eye,
  RefreshCw
} from 'lucide-react'

interface ModelInfo {
  name: string
  displayName: string
  type: 'primary' | 'fallback' | 'backup'
  fineTuned: boolean
  status: 'active' | 'inactive' | 'error'
  lastUsed?: Date
  tokensUsed?: number
  requestCount?: number
  averageLatency?: number
  errorRate?: number
}

interface AIStats {
  totalRequests: number
  totalTokens: number
  averageLatency: number
  errorRate: number
  costEstimate: number
  popularFeatures: Array<{ name: string; count: number }>
}

interface TestResult {
  success: boolean
  model: string
  latency: number
  tokensUsed: number
}

export default function AIModelDashboard() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [stats, _setStats] = useState<AIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [_testResult, setTestResult] = useState<TestResult | null>(null)

  useEffect(() => {
    fetchModelInfo()
  }, [])

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('/api/admin/ai-models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models)
        setDebugMode(data.debugMode)
      } else {
        console.error('Failed to load model information')
      }
    } catch (error) {
      console.error('Failed to fetch model info:', error)
      console.error('Failed to load model information')
    } finally {
      setLoading(false)
    }
  }

  // TODO: Uncomment when stats functionality is implemented
  // const _fetchStats = async () => {
  //   try {
  //     const response = await fetch('/api/admin/ai-stats')
  //     if (response.ok) {
  //       const data = await response.json()
  //       setStats(data)
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch AI stats:', error)
  //   }
  // }

  const testModel = async (modelName: string) => {
    setTesting(modelName)
    try {
      const response = await fetch('/api/admin/test-ai-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Add success state and display in UI
        setTestResult({
          success: true,
          model: result.model,
          latency: result.latency,
          tokensUsed: result.tokensUsed
        })
      } else {
        const error = await response.json()
        alert(`Test failed: ${error.message}`)
      }
    } catch (error) {
      alert(`Test failed: ${error}`)
    } finally {
      setTesting(null)
    }
  }

  const toggleDebugMode = async () => {
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debugMode: !debugMode })
      })
      
      if (response.ok) {
        setDebugMode(!debugMode)
      } else {
        console.error('Failed to toggle debug mode')
      }
    } catch (error) {
      console.error('Failed to toggle debug mode:', error)
      console.error('Failed to toggle debug mode')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-brand-100 text-brand-800'
      case 'fallback': return 'bg-green-100 text-green-800'
      case 'backup': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading AI dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Model Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage your fine-tuned AI models
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={debugMode ? "default" : "outline"}
            size="sm"
            onClick={toggleDebugMode}
          >
            <Eye className="h-4 w-4 mr-2" />
            Debug Mode
          </Button>
          <Button variant="outline" size="sm" onClick={fetchModelInfo}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {debugMode && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Debug mode is enabled. All AI requests will be logged to the console.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Card key={model.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(model.status)}
                      <CardTitle className="text-sm">
                        {model.displayName}
                      </CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Badge variant="outline" className={getTypeColor(model.type)}>
                        {model.type}
                      </Badge>
                      {model.fineTuned && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Fine-tuned
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs truncate">
                    {model.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Requests</div>
                      <div className="font-semibold">{model.requestCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tokens</div>
                      <div className="font-semibold">{model.tokensUsed?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Latency</div>
                      <div className="font-semibold">{model.averageLatency || 0}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Error Rate</div>
                      <div className="font-semibold">{((model.errorRate || 0) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  {model.lastUsed && (
                    <div className="text-xs text-muted-foreground">
                      Last used: {new Date(model.lastUsed).toLocaleString()}
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => testModel(model.name)}
                    disabled={testing === model.name}
                  >
                    {testing === model.name ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    Test Model
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">AI API calls made</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Tokens processed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageLatency.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground">Response time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats.errorRate * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Failed requests</p>
                </CardContent>
              </Card>
            </div>
          )}

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Popular AI Features</CardTitle>
                <CardDescription>Most frequently used AI capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.popularFeatures.map((feature, _index) => (
                    <div key={feature.name} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{feature.name}</span>
                          <span className="text-sm text-muted-foreground">{feature.count}</span>
                        </div>
                        <Progress 
                          value={stats.popularFeatures[0]?.count ? 
                            (feature.count / stats.popularFeatures[0].count) * 100 : 0}
                          className="h-2 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Brainstorming', endpoint: '/api/ai/brainstorm', icon: Brain },
              { name: 'Content Extraction', endpoint: '/api/ai/extract', icon: Cpu },
              { name: 'Content Rewriting', endpoint: '/api/ai/rewrite', icon: Settings },
              { name: 'Document Summarization', endpoint: '/api/ai/summarize', icon: Activity },
              { name: 'Strategy Generation', endpoint: '/api/ai/strategy-generation', icon: TrendingUp },
              { name: 'Fact Checking', endpoint: '/api/ai/fact-check', icon: CheckCircle }
            ].map((feature) => (
              <Card key={feature.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <feature.icon className="h-5 w-5 text-brand-500" />
                    <CardTitle className="text-sm">{feature.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {feature.endpoint}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    Test Feature
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 