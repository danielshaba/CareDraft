/**
 * Script to initialize Supabase storage buckets for CareDraft
 * Run with: node scripts/setup-storage.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Storage bucket configuration
const STORAGE_BUCKETS = {
  TENDER_DOCUMENTS: 'tender-documents',
  EXPORTS: 'exports',
  KNOWLEDGE_BASE: 'knowledge-base',
}

const BUCKET_CONFIG = {
  [STORAGE_BUCKETS.TENDER_DOCUMENTS]: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.oasis.opendocument.text', // .odt
    ],
    isPublic: true,
    description: 'Uploaded tender documents and RFP files',
  },
  [STORAGE_BUCKETS.EXPORTS]: {
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'application/zip',
    ],
    isPublic: false,
    description: 'Generated bid documents and exports',
  },
  [STORAGE_BUCKETS.KNOWLEDGE_BASE]: {
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'text/markdown',
      'text/html',
    ],
    isPublic: false,
    description: 'Company knowledge base documents and templates',
  },
}

async function initializeStorageBuckets() {
  // Check required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
    console.error('')
    console.error('Please ensure these variables are set in your .env.local file')
    process.exit(1)
  }
  
  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  console.log('🚀 Initializing CareDraft storage buckets...')
  console.log('')
  
  const results = []
  
  for (const [bucketKey, bucketId] of Object.entries(STORAGE_BUCKETS)) {
    const config = BUCKET_CONFIG[bucketId]
    
    console.log(`📁 Processing bucket: ${bucketId}`)
    console.log(`   Description: ${config.description}`)
    console.log(`   Max size: ${Math.round(config.maxSizeBytes / (1024 * 1024))}MB`)
    console.log(`   Public: ${config.isPublic}`)
    console.log(`   Allowed types: ${config.allowedMimeTypes.length} types`)
    
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase
        .storage
        .listBuckets()
      
      if (listError) {
        console.error(`   ❌ Error checking buckets: ${listError.message}`)
        results.push({ bucket: bucketId, status: 'error', error: listError })
        continue
      }
      
      const existingBucket = buckets.find(b => b.id === bucketId)
      
      if (existingBucket) {
        console.log(`   ✅ Bucket already exists`)
        results.push({ bucket: bucketId, status: 'exists', error: null })
        console.log('')
        continue
      }
      
      // Create bucket if it doesn't exist
      const { data, error } = await supabase
        .storage
        .createBucket(bucketId, {
          public: config.isPublic,
          fileSizeLimit: config.maxSizeBytes,
          allowedMimeTypes: config.allowedMimeTypes,
        })
      
      if (error) {
        console.error(`   ❌ Failed to create bucket: ${error.message}`)
        results.push({ bucket: bucketId, status: 'error', error })
      } else {
        console.log(`   ✅ Created successfully`)
        results.push({ bucket: bucketId, status: 'created', error: null, data })
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`)
      results.push({ bucket: bucketId, status: 'exception', error: err })
    }
    
    console.log('')
  }
  
  // Summary
  console.log('📋 Summary:')
  console.log('=' + '='.repeat(50))
  
  const created = results.filter(r => r.status === 'created').length
  const existing = results.filter(r => r.status === 'exists').length
  const errors = results.filter(r => r.status === 'error' || r.status === 'exception').length
  
  console.log(`✅ Created: ${created}`)
  console.log(`📁 Already existed: ${existing}`)
  console.log(`❌ Errors: ${errors}`)
  
  if (errors > 0) {
    console.log('')
    console.log('Error details:')
    results
      .filter(r => r.status === 'error' || r.status === 'exception')
      .forEach(r => {
        console.log(`  ${r.bucket}: ${r.error?.message || 'Unknown error'}`)
      })
    
    process.exit(1)
  }
  
  console.log('')
  console.log('🎉 Storage initialization complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Configure RLS policies (subtask 4.2)')
  console.log('2. Test file upload functionality')
  console.log('3. Implement upload components')
  
  return results
}

// Run the initialization
if (require.main === module) {
  initializeStorageBuckets()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { initializeStorageBuckets } 