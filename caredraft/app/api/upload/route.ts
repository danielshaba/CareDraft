import { NextRequest, NextResponse } from 'next/server'
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage'
import { createAdminClient } from '@/lib/supabase'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as StorageBucket
    const customFilename = formData.get('filename') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bucket || !Object.values(STORAGE_BUCKETS).includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket specified' }, { status: 400 })
    }

    // Basic file validation
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    // Generate safe filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : ''
    const nameWithoutExt = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name
    const safeFilename = customFilename || `${user.id}/${nameWithoutExt}_${timestamp}${extension}`

    // Upload file using admin client
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase.storage
      .from(bucket)
      .upload(safeFilename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      filePath: data.path,
      data: data
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
} 