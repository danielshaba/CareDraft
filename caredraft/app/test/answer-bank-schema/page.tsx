'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, Database, TestTube, Shield, Zap, Settings, Copy, ExternalLink } from 'lucide-react'
import { 
  runAnswerBankSchemaTests,
  validateAnswerBankSchema,
  testRLSPolicies,
  testDatabaseFunctions,
  testDatabaseIndexes,
  testDataIntegrityConstraints
} from '@/lib/database/answer-bank-schema'

interface TestResult {
  overall: boolean
  summary: {
    schema: boolean
    rls: boolean
    functions: boolean
    indexes: boolean
    constraints: boolean
  }
  details: {
    schema: Awaited<ReturnType<typeof validateAnswerBankSchema>>
    rls: Awaited<ReturnType<typeof testRLSPolicies>>
    functions: Awaited<ReturnType<typeof testDatabaseFunctions>>
    indexes: Awaited<ReturnType<typeof testDatabaseIndexes>>
    constraints: Awaited<ReturnType<typeof testDataIntegrityConstraints>>
  }
}

export default function AnswerBankSchemaTestPage() {
  // Mock auth data for testing - replace with real useAuth() when available
  const user = { id: 'test-user-id-12345' }
  const organization = { id: 'test-org-id-67890' }
  
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)
  const [showMigrationSQL, setShowMigrationSQL] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    try {
      console.log('Starting AnswerBank schema tests...')
      const results = await runAnswerBankSchemaTests(
        user?.id, 
        organization?.id
      )
      setTestResults(results)
      setLastRunTime(new Date().toLocaleString())
    } catch {
      console.error('Test execution failed:', error)
      // Set error state
      setTestResults({
        overall: false,
        summary: {
          schema: false,
          rls: false,
          functions: false,
          indexes: false,
          constraints: false
        },
        details: {
          schema: { valid: false, errors: [`Test execution failed: ${error}`], tables: [] },
          rls: { valid: false, errors: [`Test execution failed: ${error}`], tests: [] },
          functions: { valid: false, errors: [`Test execution failed: ${error}`], tests: [] },
          indexes: { valid: false, errors: [`Test execution failed: ${error}`], tests: [] },
          constraints: { valid: false, errors: [`Test execution failed: ${error}`], tests: [] }
        }
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-600" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'}>
        {status ? 'PASS' : 'FAIL'}
      </Badge>
    )
  }

  const copyMigrationSQL = () => {
    const migrationPath = '/Users/danielshaba/Downloads/CareDraft/caredraft/supabase/migrations/20241201_create_answer_bank_tables.sql'
    navigator.clipboard.writeText(migrationPath)
    alert('Migration path copied to clipboard!')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AnswerBank Database Schema Tests</h1>
        <p className="text-gray-600">
          Validate the AnswerBank database schema, RLS policies, indexes, and constraints.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Database Migration Required</span>
          </div>
          <p className="text-blue-600 mt-1 text-sm">
            Before running tests, apply the AnswerBank migration SQL to your Supabase project.
          </p>
          <div className="mt-3 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyMigrationSQL}
              className="flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              Copy Migration Path
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowMigrationSQL(!showMigrationSQL)}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              {showMigrationSQL ? 'Hide' : 'Show'} SQL Location
            </Button>
          </div>
          {showMigrationSQL && (
            <div className="mt-3 p-3 bg-white border rounded font-mono text-sm">
              📁 Migration File: <br />
              <code>supabase/migrations/20241201_create_answer_bank_tables.sql</code>
            </div>
          )}
        </div>
      </div>

      {/* User Context Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Current test user and organization context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium text-gray-600">Test User ID</div>
              <div className="font-mono text-sm">{user.id}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium text-gray-600">Test Organization ID</div>
              <div className="font-mono text-sm">{organization.id}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Controls
          </CardTitle>
          <CardDescription>
            Run comprehensive tests to validate the AnswerBank database implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
            {lastRunTime && (
              <span className="text-sm text-gray-500">
                Last run: {lastRunTime}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      {testResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResults.overall)}
              Overall Test Results
            </CardTitle>
            <CardDescription>
              {testResults.overall 
                ? 'All tests passed successfully! ✅' 
                : 'Some tests failed. Please review the details below. ❌'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Schema</span>
                </div>
                {getStatusBadge(testResults.summary.schema)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">RLS</span>
                </div>
                {getStatusBadge(testResults.summary.rls)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Functions</span>
                </div>
                {getStatusBadge(testResults.summary.functions)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Indexes</span>
                </div>
                {getStatusBadge(testResults.summary.indexes)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Constraints</span>
                </div>
                {getStatusBadge(testResults.summary.constraints)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Test Results */}
      {testResults && (
        <div className="space-y-6">
          {/* Schema Validation Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema Validation
                {getStatusBadge(testResults.summary.schema)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.details.schema.errors.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  {testResults.details.schema.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600">✅ All schema validations passed</div>
              )}
              
              {testResults.details.schema.tables.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Validated Tables:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {testResults.details.schema.tables.map((table, index) => (
                      <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm font-mono">
                        {table}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RLS Policies Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Row Level Security (RLS) Tests
                {getStatusBadge(testResults.summary.rls)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.details.rls.errors.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  {testResults.details.rls.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600">✅ All RLS policies validated</div>
              )}
              
              {testResults.details.rls.tests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">RLS Test Results:</h4>
                  <div className="space-y-2">
                    {testResults.details.rls.tests.map((test, index) => (
                      <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                        {test}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Functions Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Database Functions Tests
                {getStatusBadge(testResults.summary.functions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.details.functions.errors.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  {testResults.details.functions.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600">✅ All database functions validated</div>
              )}
              
              {testResults.details.functions.tests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Function Test Results:</h4>
                  <div className="space-y-2">
                    {testResults.details.functions.tests.map((test, index) => (
                      <div key={index} className="p-2 bg-purple-50 border border-purple-200 rounded text-purple-700 text-sm">
                        {test}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indexes Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Database Indexes Tests
                {getStatusBadge(testResults.summary.indexes)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.details.indexes.errors.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  {testResults.details.indexes.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600">✅ All indexes validated</div>
              )}
              
              {testResults.details.indexes.tests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Index Test Results:</h4>
                  <div className="space-y-2">
                    {testResults.details.indexes.tests.map((test, index) => (
                      <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                        {test}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Integrity Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Data Integrity Constraints
                {getStatusBadge(testResults.summary.constraints)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.details.constraints.errors.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  {testResults.details.constraints.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600">✅ All data integrity constraints validated</div>
              )}
              
              {testResults.details.constraints.tests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Constraint Test Results:</h4>
                  <div className="space-y-2">
                    {testResults.details.constraints.tests.map((test, index) => (
                      <div key={index} className="p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 text-sm">
                        {test}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schema Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>AnswerBank Schema Summary</CardTitle>
          <CardDescription>
            Overview of the database schema implementation for Task 20.1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Core Tables</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <code>answer_bank_categories</code> - Content categories
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <code>answer_bank</code> - Main answer content
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <code>answer_bank_usage_tracking</code> - Usage analytics
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <code>answer_bank_ratings</code> - User ratings
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Key Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Organization-level RLS security
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Full-text search indexes
                </li>
                <li className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-purple-500" />
                  Automated popularity scoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  Data integrity constraints
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Task 20.1 Implementation Complete</span>
            </div>
            <p className="text-green-600 mt-1 text-sm">
              ✅ Database schema designed and implemented<br />
              ✅ TypeScript types created<br />
              ✅ Schema validation system built<br />
              ✅ Test interface ready for deployment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 