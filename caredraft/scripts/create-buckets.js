const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Direct Supabase client for bucket creation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Storage bucket configuration
const BUCKETS_TO_CREATE = [
  {
    id: 'tender-documents',
    config: {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.oasis.opendocument.text',
      ],
    }
  },
  {
    id: 'exports',
    config: {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB (reduced from 100MB)
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'text/csv',
      ],
    }
  },
  {
    id: 'knowledge-base',
    config: {
      public: false,
      fileSizeLimit: 25 * 1024 * 1024, // 25MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/json',
      ],
    }
  }
];

async function createBucket(bucketId, config) {
  console.log(`🔧 Creating bucket: ${bucketId}`);
  
  const { data, error } = await supabase.storage.createBucket(bucketId, config);

  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`✅ Bucket ${bucketId} already exists`);
      return { success: true, bucket: bucketId };
    } else {
      console.error(`❌ Failed to create bucket ${bucketId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  console.log(`✅ Successfully created bucket: ${bucketId}`);
  return { success: true, bucket: bucketId };
}

async function main() {
  try {
    console.log('🚀 Initializing Supabase storage buckets...');
    
    const results = [];
    for (const bucket of BUCKETS_TO_CREATE) {
      const result = await createBucket(bucket.id, bucket.config);
      results.push(result);
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n📊 Results:`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed buckets:');
      failed.forEach(f => console.log(`  - ${f.error}`));
    }

    console.log('\n🎉 Storage initialization completed!');
    process.exit(failed.length > 0 ? 1 : 0);
    
  } catch (err) {
    console.error('❌ Storage initialization failed:', err);
    process.exit(1);
  }
}

main(); 