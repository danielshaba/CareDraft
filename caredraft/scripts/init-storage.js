const { initializeStorageBuckets } = require('../lib/storage.ts');

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