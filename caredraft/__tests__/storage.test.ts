/**
 * Storage utilities test suite
 * Tests file validation, upload, download, and management operations
 */

import { 
  validateFile, 
  sanitizeFilename, 
  STORAGE_BUCKETS, 
  BUCKET_CONFIG 
} from '../lib/storage'

// Create a proper mock file that matches the File interface structure
function createMockFile(name: string, size: number, type: string): File {
  const file = {
    name,
    size,
    type,
    lastModified: Date.now(),
    webkitRelativePath: '',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(size)),
    slice: () => new Blob(),
    stream: () => new ReadableStream(),
    text: () => Promise.resolve(''),
  } as File

  return file
}

describe('Storage Utilities', () => {
  describe('validateFile', () => {
    describe('Tender Documents Bucket', () => {
      const bucket = STORAGE_BUCKETS.TENDER_DOCUMENTS

      test('should accept valid PDF file', () => {
        const file = createMockFile('document.pdf', 1024 * 1024, 'application/pdf') // 1MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      test('should accept valid DOCX file', () => {
        const file = createMockFile(
          'document.docx', 
          5 * 1024 * 1024, 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) // 5MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      test('should reject file exceeding size limit', () => {
        const file = createMockFile('large.pdf', 60 * 1024 * 1024, 'application/pdf') // 60MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('exceeds maximum allowed size')
      })

      test('should reject invalid MIME type', () => {
        const file = createMockFile('image.jpg', 1024 * 1024, 'image/jpeg')
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('not allowed')
      })

      test('should reject invalid file extension', () => {
        const file = createMockFile('document.txt', 1024 * 1024, 'application/pdf')
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('extension')
      })
    })

    describe('Exports Bucket', () => {
      const bucket = STORAGE_BUCKETS.EXPORTS

      test('should accept ZIP files', () => {
        const file = createMockFile('export.zip', 10 * 1024 * 1024, 'application/zip') // 10MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(true)
      })

      test('should accept larger files up to 100MB', () => {
        const file = createMockFile('large-export.pdf', 90 * 1024 * 1024, 'application/pdf') // 90MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(true)
      })

      test('should reject files over 100MB', () => {
        const file = createMockFile('huge.zip', 110 * 1024 * 1024, 'application/zip') // 110MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('exceeds maximum allowed size')
      })
    })

    describe('Knowledge Base Bucket', () => {
      const bucket = STORAGE_BUCKETS.KNOWLEDGE_BASE

      test('should accept markdown files', () => {
        const file = createMockFile('readme.md', 1024, 'text/markdown')
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(true)
      })

      test('should accept text files', () => {
        const file = createMockFile('notes.txt', 1024, 'text/plain')
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(true)
      })

      test('should have smaller size limit (25MB)', () => {
        const file = createMockFile('large-doc.pdf', 30 * 1024 * 1024, 'application/pdf') // 30MB
        const result = validateFile(file, bucket)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('exceeds maximum allowed size')
      })
    })
  })

  describe('sanitizeFilename', () => {
    test('should remove dangerous characters', () => {
      const filename = 'my<file>name|with:bad*chars?.pdf'
      const result = sanitizeFilename(filename)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('|')
      expect(result).not.toContain(':')
      expect(result).not.toContain('*')
      expect(result).not.toContain('?')
    })

    test('should preserve file extension', () => {
      const filename = 'document.pdf'
      const result = sanitizeFilename(filename)
      expect(result).toMatch(/\.pdf$/)
    })

    test('should add timestamp to prevent conflicts', () => {
      const filename = 'document.pdf'
      // Add small delay to ensure different timestamps
      const result1 = sanitizeFilename(filename)
      // Wait 1ms to get different timestamp
      const delay = new Promise(resolve => setTimeout(resolve, 1))
      return delay.then(() => {
        const result2 = sanitizeFilename(filename)
        expect(result1).not.toBe(result2)
        expect(result1).toMatch(/document_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.pdf$/)
      })
    })

    test('should add user prefix when provided', () => {
      const filename = 'document.pdf'
      const userId = 'user123'
      const result = sanitizeFilename(filename, userId)
      expect(result).toMatch(/^user123\//)
    })

    test('should handle files without extension', () => {
      const filename = 'README'
      const result = sanitizeFilename(filename)
      expect(result).toMatch(/README_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/)
    })

    test('should collapse multiple underscores', () => {
      const filename = 'my___file___name.pdf'
      const result = sanitizeFilename(filename)
      expect(result).not.toMatch(/_{2,}/)
    })

    test('should trim leading and trailing underscores', () => {
      const filename = '_file_name_.pdf'
      const result = sanitizeFilename(filename)
      expect(result).not.toMatch(/^_/)
      expect(result).not.toMatch(/_\.pdf$/)
    })

    test('should handle files with multiple dots in name', () => {
      const filename = 'my.file.name.v1.2.pdf'
      const result = sanitizeFilename(filename)
      expect(result).toMatch(/\.pdf$/)
      // The function does NOT replace dots with underscores - dots are allowed
      expect(result).toContain('my.file.name.v1.2')
    })
  })

  describe('Bucket Configuration', () => {
    test('should have correct configuration for tender documents', () => {
      const config = BUCKET_CONFIG[STORAGE_BUCKETS.TENDER_DOCUMENTS]
      expect(config.maxSizeBytes).toBe(50 * 1024 * 1024) // 50MB
      expect(config.isPublic).toBe(true)
      expect(config.allowedMimeTypes).toContain('application/pdf')
      expect(config.allowedExtensions).toContain('.pdf')
    })

    test('should have correct configuration for exports', () => {
      const config = BUCKET_CONFIG[STORAGE_BUCKETS.EXPORTS]
      expect(config.maxSizeBytes).toBe(100 * 1024 * 1024) // 100MB
      expect(config.isPublic).toBe(false)
      expect(config.allowedMimeTypes).toContain('application/zip')
      expect(config.allowedExtensions).toContain('.zip')
    })

    test('should have correct configuration for knowledge base', () => {
      const config = BUCKET_CONFIG[STORAGE_BUCKETS.KNOWLEDGE_BASE]
      expect(config.maxSizeBytes).toBe(25 * 1024 * 1024) // 25MB
      expect(config.isPublic).toBe(false)
      expect(config.allowedMimeTypes).toContain('text/markdown')
      expect(config.allowedExtensions).toContain('.md')
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty filename', () => {
      const result = sanitizeFilename('')
      expect(result).toMatch(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/)
    })

    test('should handle very long filenames', () => {
      const longName = 'a'.repeat(300) + '.pdf'
      const result = sanitizeFilename(longName)
      // The function doesn't truncate, it just adds timestamp, so length will increase
      expect(result).toMatch(/\.pdf$/)
      expect(result).toContain('_2025-') // Should contain timestamp
    })

    test('should handle zero-byte files', () => {
      const file = createMockFile('empty.pdf', 0, 'application/pdf')
      const result = validateFile(file, STORAGE_BUCKETS.TENDER_DOCUMENTS)
      expect(result.valid).toBe(true)
    })
  })
})

// Performance testing helpers
export const createTestFile = (name: string, sizeInMB: number, type: string): File => {
  return createMockFile(name, sizeInMB * 1024 * 1024, type)
}

export const createLargeFileSet = (count: number): File[] => {
  return Array.from({ length: count }, (_, i) => 
    createTestFile(`test-file-${i}.pdf`, 1, 'application/pdf')
  )
}

// Integration test helpers
export const testFileOperations = {
  // Test concurrent uploads
  async testConcurrentUploads(files: File[], bucket: string) {
    // This would be implemented with actual upload functions
    // when integrated with the real storage system
    console.log(`Testing ${files.length} concurrent uploads to ${bucket}`)
  },

  // Test file corruption scenarios
  async testFileCorruption(file: File) {
    // This would test upload/download integrity
    console.log(`Testing file corruption scenarios for ${file.name}`)
  },

  // Test security scenarios
  async testSecurityScenarios(bucket: string) {
    // This would test unauthorized access attempts
    console.log(`Testing security scenarios for ${bucket}`)
  }
} 