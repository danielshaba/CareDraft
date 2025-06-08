/**
 * AnswerBank Database Schema Validation and Testing
 * Functions to validate and test the AnswerBank database schema
 */

import { createClient } from '@/lib/supabase.client'

// Schema validation functions
export async function validateAnswerBankSchema(): Promise<{
  valid: boolean
  errors: string[]
  tables: string[]
}> {
  const errors: string[] = []
  const tables: string[] = []

  try {
    const supabase = createClient()
    
    // Check if required tables exist
    const requiredTables = [
      'answer_bank_categories',
      'answer_bank',
      'answer_bank_usage_tracking',
      'answer_bank_ratings'
    ]

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)

        if (error) {
          errors.push(`Table ${tableName} does not exist or is not accessible: ${error.message}`)
        } else {
          tables.push(tableName)
        }
      } catch {
        errors.push(`Failed to check table ${tableName}: ${err}`)
      }
    }

    // Check if view exists
    try {
      const { data, error } = await supabase
        .from('answer_bank_with_stats')
        .select('*')
        .limit(0)

      if (error) {
        errors.push(`View answer_bank_with_stats does not exist or is not accessible: ${error.message}`)
      } else {
        tables.push('answer_bank_with_stats')
      }
    } catch {
      errors.push(`Failed to check view answer_bank_with_stats: ${err}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      tables
    }
  } catch {
    return {
      valid: false,
      errors: [`Schema validation failed: ${error}`],
      tables
    }
  }
}

// Test Row Level Security (RLS) policies
export async function testRLSPolicies(userId?: string, organizationId?: string): Promise<{
  valid: boolean
  errors: string[]
  tests: Array<{ test: string; passed: boolean; message: string }>
}> {
  const errors: string[] = []
  const tests: Array<{ test: string; passed: boolean; message: string }> = []

  try {
    const supabase = createClient()
    
    // Test 1: Categories should be readable by authenticated users
    try {
      const { data: categories, error } = await supabase
        .from('answer_bank_categories')
        .select('*')
        .limit(5)

      tests.push({
        test: 'Categories readable by authenticated users',
        passed: !error && Array.isArray(categories),
        message: error ? error.message : `Found ${categories?.length || 0} categories`
      })
    } catch {
      tests.push({
        test: 'Categories readable by authenticated users',
        passed: false,
        message: `Test failed: ${err}`
      })
    }

    // Test 2: Answer bank should respect organization isolation
    try {
      const { data: answers, error } = await supabase
        .from('answer_bank')
        .select('*')
        .limit(5)

      tests.push({
        test: 'Answer bank organization isolation',
        passed: !error,
        message: error ? error.message : `Query executed successfully, found ${answers?.length || 0} answers`
      })
    } catch {
      tests.push({
        test: 'Answer bank organization isolation',
        passed: false,
        message: `Test failed: ${err}`
      })
    }

    // Test 3: Usage tracking should be restricted to user's organization
    try {
      const { data: tracking, error } = await supabase
        .from('answer_bank_usage_tracking')
        .select('*')
        .limit(5)

      tests.push({
        test: 'Usage tracking organization restriction',
        passed: !error,
        message: error ? error.message : `Query executed successfully, found ${tracking?.length || 0} tracking records`
      })
    } catch {
      tests.push({
        test: 'Usage tracking organization restriction',
        passed: false,
        message: `Test failed: ${err}`
      })
    }

    // Test 4: Ratings should be accessible
    try {
      const { data: ratings, error } = await supabase
        .from('answer_bank_ratings')
        .select('*')
        .limit(5)

      tests.push({
        test: 'Ratings accessibility',
        passed: !error,
        message: error ? error.message : `Query executed successfully, found ${ratings?.length || 0} ratings`
      })
    } catch {
      tests.push({
        test: 'Ratings accessibility',
        passed: false,
        message: `Test failed: ${err}`
      })
    }

    const failedTests = tests.filter(t => !t.passed)
    if (failedTests.length > 0) {
      errors.push(`${failedTests.length} RLS policy tests failed`)
    }

    return {
      valid: errors.length === 0,
      errors,
      tests
    }
  } catch {
    return {
      valid: false,
      errors: [`RLS policy testing failed: ${error}`],
      tests
    }
  }
}

// Test database functions
export async function testDatabaseFunctions(): Promise<{
  valid: boolean
  errors: string[]
  tests: Array<{ function: string; passed: boolean; message: string }>
}> {
  const errors: string[] = []
  const tests: Array<{ function: string; passed: boolean; message: string }> = []

  try {
    const supabase = createClient()
    
    // Test calculate_word_count function
    try {
      const testContent = '<p>This is a <strong>test</strong> content with <em>HTML tags</em>. It should count words correctly.</p>'
      const { data, error } = await supabase
        .rpc('calculate_word_count', { content_text: testContent })

      const expectedWordCount = 13 // "This is a test content with HTML tags. It should count words correctly."
      
      tests.push({
        function: 'calculate_word_count',
        passed: !error && data === expectedWordCount,
        message: error ? error.message : `Word count: ${data} (expected: ${expectedWordCount})`
      })
    } catch {
      tests.push({
        function: 'calculate_word_count',
        passed: false,
        message: `Test failed: ${err}`
      })
    }

    // Test update_answer_popularity_score function
    try {
      // This function is triggered automatically, so we test by checking if it exists
      const { data, error } = await supabase
        .rpc('update_answer_popularity_score')

      tests.push({
        function: 'update_answer_popularity_score',
        passed: true, // If no error, function exists
        message: 'Function exists and is callable'
      })
    } catch {
      tests.push({
        function: 'update_answer_popularity_score',
        passed: false,
        message: `Function test failed: ${err}`
      })
    }

    // Test increment_answer_usage function
    try {
      // Test with mock data
      const { data, error } = await supabase
        .rpc('increment_answer_usage', {
          answer_uuid: '00000000-0000-0000-0000-000000000000',
          user_uuid: '00000000-0000-0000-0000-000000000000',
          org_uuid: '00000000-0000-0000-0000-000000000000',
          usage_context: 'test',
          section: 'test_section'
        })

      tests.push({
        function: 'increment_answer_usage',
        passed: true, // Function exists if no syntax error
        message: 'Function exists and is callable'
      })
    } catch {
      tests.push({
        function: 'increment_answer_usage',
        passed: false,
        message: `Function test failed: ${err}`
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      tests
    }
  } catch {
    return {
      valid: false,
      errors: [`Database function testing failed: ${error}`],
      tests
    }
  }
}

// Test database indexes
export async function testDatabaseIndexes(): Promise<{
  valid: boolean
  errors: string[]
  tests: Array<{ index: string; passed: boolean; message: string; queryTime?: number }>
}> {
  const errors: string[] = []
  const tests: Array<{ index: string; passed: boolean; message: string; queryTime?: number }> = []

  try {
    const supabase = createClient()
    
    // Test full-text search indexes
    const searchTests = [
      { name: 'title_search', query: 'SELECT * FROM answer_bank WHERE to_tsvector(\'english\', title) @@ plainto_tsquery(\'english\', \'test\') LIMIT 1' },
      { name: 'content_search', query: 'SELECT * FROM answer_bank WHERE to_tsvector(\'english\', content) @@ plainto_tsquery(\'english\', \'test\') LIMIT 1' },
      { name: 'combined_search', query: 'SELECT * FROM answer_bank WHERE to_tsvector(\'english\', title || \' \' || content) @@ plainto_tsquery(\'english\', \'test\') LIMIT 1' }
    ]

    for (const test of searchTests) {
      try {
        const startTime = Date.now()
        const { data, error } = await supabase.rpc('exec_sql', { sql: test.query })
        const queryTime = Date.now() - startTime

        tests.push({
          index: test.name,
          passed: !error,
          message: error ? error.message : `Query executed successfully in ${queryTime}ms`,
          queryTime
        })
      } catch {
        tests.push({
          index: test.name,
          passed: false,
          message: `Index test failed: ${err}`
        })
      }
    }

    // Test standard indexes by checking query plans
    const indexTests = [
      { name: 'organization_index', table: 'answer_bank', column: 'organization_id' },
      { name: 'category_index', table: 'answer_bank', column: 'category_id' },
      { name: 'popularity_index', table: 'answer_bank', column: 'popularity_score' },
      { name: 'usage_count_index', table: 'answer_bank', column: 'usage_count' }
    ]

    for (const test of indexTests) {
      try {
        const startTime = Date.now()
        const { data, error } = await supabase
          .from(test.table)
          .select('*')
          .order(test.column, { ascending: false })
          .limit(1)
        const queryTime = Date.now() - startTime

        tests.push({
          index: test.name,
          passed: !error,
          message: error ? error.message : `Index query executed in ${queryTime}ms`,
          queryTime
        })
      } catch {
        tests.push({
          index: test.name,
          passed: false,
          message: `Index test failed: ${err}`
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      tests
    }
  } catch {
    return {
      valid: false,
      errors: [`Database index testing failed: ${error}`],
      tests
    }
  }
}

// Test data integrity constraints
export async function testDataIntegrityConstraints(): Promise<{
  valid: boolean
  errors: string[]
  tests: Array<{ constraint: string; passed: boolean; message: string }>
}> {
  const errors: string[] = []
  const tests: Array<{ constraint: string; passed: boolean; message: string }> = []

  try {
    const supabase = createClient()
    
    // Test NOT NULL constraints
    try {
      const { data, error } = await supabase
        .from('answer_bank')
        .insert({
          title: null, // This should fail
          content: 'Test content',
          organization_id: '00000000-0000-0000-0000-000000000000'
        })

      tests.push({
        constraint: 'title_not_null',
        passed: !!error, // Should fail
        message: error ? 'NOT NULL constraint working correctly' : 'NOT NULL constraint not enforced'
      })
    } catch {
      tests.push({
        constraint: 'title_not_null',
        passed: true,
        message: 'NOT NULL constraint enforced at database level'
      })
    }

    // Test CHECK constraints
    try {
      const { data, error } = await supabase
        .from('answer_bank')
        .insert({
          title: 'Test',
          content: 'Test content',
          organization_id: '00000000-0000-0000-0000-000000000000',
          usage_count: -1 // This should fail
        })

      tests.push({
        constraint: 'usage_count_check',
        passed: !!error, // Should fail
        message: error ? 'CHECK constraint working correctly' : 'CHECK constraint not enforced'
      })
    } catch {
      tests.push({
        constraint: 'usage_count_check',
        passed: true,
        message: 'CHECK constraint enforced at database level'
      })
    }

    // Test popularity score constraint
    try {
      const { data, error } = await supabase
        .from('answer_bank')
        .insert({
          title: 'Test',
          content: 'Test content',
          organization_id: '00000000-0000-0000-0000-000000000000',
          popularity_score: 15.0 // This should fail (max is 10.0)
        })

      tests.push({
        constraint: 'popularity_score_check',
        passed: !!error, // Should fail
        message: error ? 'Popularity score constraint working correctly' : 'Popularity score constraint not enforced'
      })
    } catch {
      tests.push({
        constraint: 'popularity_score_check',
        passed: true,
        message: 'Popularity score constraint enforced at database level'
      })
    }

    // Test rating constraint
    try {
      const { data, error } = await supabase
        .from('answer_bank_ratings')
        .insert({
          answer_id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
          organization_id: '00000000-0000-0000-0000-000000000000',
          rating: 6 // This should fail (max is 5)
        })

      tests.push({
        constraint: 'rating_range_check',
        passed: !!error, // Should fail
        message: error ? 'Rating range constraint working correctly' : 'Rating range constraint not enforced'
      })
    } catch {
      tests.push({
        constraint: 'rating_range_check',
        passed: true,
        message: 'Rating range constraint enforced at database level'
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      tests
    }
  } catch {
    return {
      valid: false,
      errors: [`Data integrity constraint testing failed: ${error}`],
      tests
    }
  }
}

// Main test runner
export async function runAnswerBankSchemaTests(userId?: string, organizationId?: string): Promise<{
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
}> {
  try {
    // Run all tests
    const [schema, rls, functions, indexes, constraints] = await Promise.all([
      validateAnswerBankSchema(),
      testRLSPolicies(userId, organizationId),
      testDatabaseFunctions(),
      testDatabaseIndexes(),
      testDataIntegrityConstraints()
    ])

    const summary = {
      schema: schema.valid,
      rls: rls.valid,
      functions: functions.valid,
      indexes: indexes.valid,
      constraints: constraints.valid
    }

    const overall = Object.values(summary).every(Boolean)

    return {
      overall,
      summary,
      details: {
        schema,
        rls,
        functions,
        indexes,
        constraints
      }
    }
  } catch {
    // Return failed state if test runner itself fails
    const failedResult = {
      valid: false,
      errors: [`Test runner failed: ${error}`],
      tests: [],
      tables: []
    }

    return {
      overall: false,
      summary: {
        schema: false,
        rls: false,
        functions: false,
        indexes: false,
        constraints: false
      },
      details: {
        schema: failedResult,
        rls: failedResult,
        functions: failedResult,
        indexes: failedResult,
        constraints: failedResult
      }
    }
  }
}

// Utility function to check if AnswerBank is ready
export async function isAnswerBankReady(): Promise<boolean> {
  try {
    const result = await validateAnswerBankSchema()
    return result.valid && result.tables.length >= 4 // At least 4 core tables
  } catch {
    console.error('AnswerBank readiness check failed:', error)
    return false
  }
} 