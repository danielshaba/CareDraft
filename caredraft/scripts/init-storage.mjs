import { createAdminClient } from '../lib/supabase.js';

// Storage bucket configuration
const STORAGE_BUCKETS = {
  TENDER_DOCUMENTS: 'tender-documents',
  EXPORTS: 'exports',
  KNOWLEDGE_BASE: 'knowledge-base',
};

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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'text/markdown',
      'text/html',
    ],
    isPublic: false,
    description: 'Company knowledge base documents and templates',
  },
};

async function initializeStorageBuckets() {
  const supabase = createAdminClient();
  
  const results = [];
  
  for (const [bucketKey, bucketId] of Object.entries(STORAGE_BUCKETS)) {
    const config = BUCKET_CONFIG[bucketId];
    
    try {
      // Check if bucket exists
      const { data: existingBucket, error: listError } = await supabase
        .storage
        .getBucket(bucketId);
      
      if (existingBucket) {
        console.log(`✅ Bucket '${bucketId}' already exists`);
        results.push({ bucket: bucketId, status: 'exists', error: null });
        continue;
      }
      
      // Create bucket if it doesn't exist
      const { data, error } = await supabase
        .storage
        .createBucket(bucketId, {
          public: config.isPublic,
          fileSizeLimit: config.maxSizeBytes,
          allowedMimeTypes: config.allowedMimeTypes,
        });
      
      if (error) {
        console.error(`❌ Failed to create bucket '${bucketId}':`, error);
        results.push({ bucket: bucketId, status: 'error', error });
      } else {
        console.log(`✅ Created bucket '${bucketId}' successfully`);
        results.push({ bucket: bucketId, status: 'created', error: null, data });
      }
    } catch (err) {
      console.error(`❌ Exception creating bucket '${bucketId}':`, err);
      results.push({ bucket: bucketId, status: 'exception', error: err });
    }
  }
  
  return results;
}

async function main() {
  try {
    console.log('🔧 Initializing Supabase storage buckets...');
    const results = await initializeStorageBuckets();
    console.log('✅ Storage initialization completed:', results);
    process.exit(0);
  } catch (err) {
    console.error('❌ Storage initialization failed:', err);
    process.exit(1);
  }
}

main(); 