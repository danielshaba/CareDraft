/**
 * Storage Bucket Security Policies for CareDraft
 * 
 * This module contains the RLS policy definitions for our three storage buckets.
 * Due to Supabase's security model, these policies need to be applied through
 * the Supabase dashboard or using the service role key.
 */

interface StoragePolicy {
  name: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  target: string
  using?: string
  check?: string
  description: string
}

interface BucketConfig {
  bucket: string
  description: string
  policies: StoragePolicy[]
}

export const STORAGE_POLICIES: Record<string, BucketConfig> = {
  // TENDER-DOCUMENTS BUCKET
  // Public bucket for uploaded tender documents
  TENDER_DOCUMENTS: {
    bucket: 'tender-documents',
    description: 'Public read access, authenticated users can upload their own files',
    policies: [
      {
        name: 'tender_documents_select',
        operation: 'SELECT',
        target: 'authenticated',
        using: `bucket_id = 'tender-documents'`,
        description: 'Allow authenticated users to view all tender documents (public read)',
      },
      {
        name: 'tender_documents_insert',
        operation: 'INSERT',
        target: 'authenticated',
        check: `bucket_id = 'tender-documents' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow authenticated users to upload files to their own folder',
      },
      {
        name: 'tender_documents_update',
        operation: 'UPDATE',
        target: 'authenticated',
        using: `bucket_id = 'tender-documents' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow users to update metadata of their own files',
      },
      {
        name: 'tender_documents_delete',
        operation: 'DELETE',
        target: 'authenticated',
        using: `bucket_id = 'tender-documents' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow users to delete their own files',
      },
    ],
  },

  // EXPORTS BUCKET
  // Private bucket for generated documents
  EXPORTS: {
    bucket: 'exports',
    description: 'Private bucket, users can only access their own generated documents',
    policies: [
      {
        name: 'exports_select',
        operation: 'SELECT',
        target: 'authenticated',
        using: `bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow users to view only their own exported documents',
      },
      {
        name: 'exports_insert',
        operation: 'INSERT',
        target: 'authenticated',
        check: `bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow users to create files in their own folder',
      },
      {
        name: 'exports_update',
        operation: 'UPDATE',
        target: 'authenticated',
        using: `bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow users to update their own files',
      },
      {
        name: 'exports_delete',
        operation: 'DELETE',
        target: 'authenticated',
        using: `bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]`,
        description: 'Allow users to delete their own files',
      },
    ],
  },

  // KNOWLEDGE-BASE BUCKET
  // Admin-only write access, authenticated read access
  KNOWLEDGE_BASE: {
    bucket: 'knowledge-base',
    description: 'Admin-only management, all authenticated users can read',
    policies: [
      {
        name: 'knowledge_base_select',
        operation: 'SELECT',
        target: 'authenticated',
        using: `bucket_id = 'knowledge-base'`,
        description: 'Allow all authenticated users to read knowledge base files',
      },
      {
        name: 'knowledge_base_insert',
        operation: 'INSERT',
        target: 'authenticated',
        check: `bucket_id = 'knowledge-base' AND is_admin_user()`,
        description: 'Only admins can upload knowledge base files',
      },
      {
        name: 'knowledge_base_update',
        operation: 'UPDATE',
        target: 'authenticated',
        using: `bucket_id = 'knowledge-base' AND is_admin_user()`,
        description: 'Only admins can update knowledge base files',
      },
      {
        name: 'knowledge_base_delete',
        operation: 'DELETE',
        target: 'authenticated',
        using: `bucket_id = 'knowledge-base' AND is_admin_user()`,
        description: 'Only admins can delete knowledge base files',
      },
    ],
  },
}

/**
 * Generate SQL statements for creating all storage policies
 */
export function generateStoragePolicySQL(): string {
  const statements: string[] = [
    '-- Storage Bucket RLS Policies for CareDraft',
    '-- Apply these policies through Supabase Dashboard > Storage > Policies',
    '',
    '-- Ensure RLS is enabled on storage.objects',
    'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;',
    '',
  ]

  Object.values(STORAGE_POLICIES).forEach(bucketConfig => {
    statements.push(`-- ${bucketConfig.bucket.toUpperCase()} BUCKET POLICIES`)
    statements.push(`-- ${bucketConfig.description}`)
    statements.push('')

    bucketConfig.policies.forEach(policy => {
      // Drop existing policy (for idempotency)
      statements.push(`DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`)
      
      // Create policy
      let policySQL = `CREATE POLICY "${policy.name}" ON storage.objects`
      policySQL += ` FOR ${policy.operation} TO ${policy.target}`
      
      if (policy.using) {
        policySQL += ` USING (${policy.using})`
      }
      
      if (policy.check) {
        policySQL += ` WITH CHECK (${policy.check})`
      }
      
      policySQL += ';'
      
      statements.push(`-- ${policy.description}`)
      statements.push(policySQL)
      statements.push('')
    })
    
    statements.push('')
  })

  return statements.join('\n')
}

/**
 * Policy setup instructions for manual application
 */
export const POLICY_SETUP_INSTRUCTIONS = `
STORAGE BUCKET POLICY SETUP INSTRUCTIONS
=======================================

Since Supabase storage policies require special permissions, follow these steps 
to set up the security policies for CareDraft storage buckets:

STEP 1: Navigate to Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to Storage section
- Click on "Policies" tab

STEP 2: Enable RLS (if not already enabled)
- Ensure Row Level Security is enabled on storage.objects table
- Go to Database > Tables > storage.objects
- Enable RLS if the toggle is off

STEP 3: Apply Policies
Copy and execute the SQL generated by generateStoragePolicySQL() function
in the SQL Editor, or create each policy manually through the dashboard:

FOR TENDER-DOCUMENTS BUCKET (Public Read, User Upload):
- Policy Name: tender_documents_select
  - Operation: SELECT
  - Target: authenticated
  - Using: bucket_id = 'tender-documents'

- Policy Name: tender_documents_insert  
  - Operation: INSERT
  - Target: authenticated
  - Check: bucket_id = 'tender-documents' AND auth.uid()::text = (storage.foldername(name))[1]

- Policy Name: tender_documents_update
  - Operation: UPDATE
  - Target: authenticated
  - Using: bucket_id = 'tender-documents' AND auth.uid()::text = (storage.foldername(name))[1]

- Policy Name: tender_documents_delete
  - Operation: DELETE
  - Target: authenticated
  - Using: bucket_id = 'tender-documents' AND auth.uid()::text = (storage.foldername(name))[1]

FOR EXPORTS BUCKET (Private, User-scoped):
- Policy Name: exports_select
  - Operation: SELECT
  - Target: authenticated
  - Using: bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]

- Policy Name: exports_insert
  - Operation: INSERT
  - Target: authenticated
  - Check: bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]

- Policy Name: exports_update
  - Operation: UPDATE
  - Target: authenticated
  - Using: bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]

- Policy Name: exports_delete
  - Operation: DELETE
  - Target: authenticated
  - Using: bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]

FOR KNOWLEDGE-BASE BUCKET (Admin Write, All Read):
- Policy Name: knowledge_base_select
  - Operation: SELECT
  - Target: authenticated
  - Using: bucket_id = 'knowledge-base'

- Policy Name: knowledge_base_insert
  - Operation: INSERT
  - Target: authenticated
  - Check: bucket_id = 'knowledge-base' AND is_admin_user()

- Policy Name: knowledge_base_update
  - Operation: UPDATE
  - Target: authenticated
  - Using: bucket_id = 'knowledge-base' AND is_admin_user()

- Policy Name: knowledge_base_delete
  - Operation: DELETE
  - Target: authenticated
  - Using: bucket_id = 'knowledge-base' AND is_admin_user()

STEP 4: Test Policies
After applying all policies, test the access controls:
1. Upload files as different user roles
2. Verify access restrictions work correctly
3. Test file operations (read, write, delete)
4. Confirm admin-only access to knowledge-base

HELPER FUNCTIONS ALREADY CREATED:
- is_admin_user(): Checks if current user has admin role
- is_manager_or_above(): Checks for manager or admin role
- owns_file(uuid): Checks file ownership

These functions are already available in your database and can be used
in policy expressions.
`

/**
 * Validate that a user can access a specific bucket
 */
export function canAccessBucket(
  userRole: 'admin' | 'manager' | 'writer' | 'viewer',
  bucket: keyof typeof STORAGE_POLICIES,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
): boolean {
  const bucketConfig = STORAGE_POLICIES[bucket]
  const policy = bucketConfig.policies.find(p => p.operation === operation)
  
  if (!policy) return false
  
  // For knowledge-base write operations, only admins allowed
  if (bucket === 'KNOWLEDGE_BASE' && operation !== 'SELECT') {
    return userRole === 'admin'
  }
  
  // All authenticated users can perform operations on their own files
  return true
}

/**
 * Get the folder path for a user's files in a bucket
 */
export function getUserFolder(userId: string, _bucket: string): string {
  return `${userId}/`
}

/**
 * Check if a file path belongs to a user
 */
export function isUserFile(filePath: string, userId: string): boolean {
  return filePath.startsWith(`${userId}/`)
}

export default STORAGE_POLICIES 