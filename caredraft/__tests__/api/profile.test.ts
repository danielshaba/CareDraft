import { NextRequest } from 'next/server'
import { jest } from '@jest/globals'

// Test data
const mockProfileData = {
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+44 7123 456789',
  organization: 'Test Company',
  website: 'https://example.com',
  address: '123 Test Street, London, UK',
  bio: 'Test bio',
  experience: '5 years',
  specializations: ['Healthcare', 'Technology'],
  qualifications: ['MBA', 'BSc'],
  languages: ['English', 'Spanish']
}

const mockUser = {
  id: 'test-user-id',
  email: 'john@example.com'
}

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn()
}

// Mock the createClient function
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock rate limiting
jest.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true })
}))

describe('/api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth mock
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('GET /api/profile', () => {
    it('returns user profile data when authenticated', async () => {
      // Mock successful profile fetch
      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfileData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET'
      })

      // Import the route handler
      const { GET } = await import('@/app/api/profile/route')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockProfileData)
    })

    it('returns 401 when user is not authenticated', async () => {
      // Mock authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/profile/route')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('handles database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/profile/route')
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch profile')
    })

    it('returns empty profile when no profile exists', async () => {
      // Mock no profile found
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/profile/route')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual({})
    })
  })

  describe('PUT /api/profile', () => {
    it('updates complete profile data when authenticated', async () => {
      const updatedProfile = {
        ...mockProfileData,
        fullName: 'John Updated Doe'
      }

      // Mock successful update
      mockSupabaseClient.single.mockResolvedValue({
        data: updatedProfile,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedProfile),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { PUT } = await import('@/app/api/profile/route')
      const response = await PUT(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.fullName).toBe('John Updated Doe')
    })

    it('validates required fields', async () => {
      const invalidProfile = {
        email: 'invalid-email' // Invalid email format
      }

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(invalidProfile),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { PUT } = await import('@/app/api/profile/route')
      const response = await PUT(request)
      
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Validation failed')
    })

    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(mockProfileData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { PUT } = await import('@/app/api/profile/route')
      const response = await PUT(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/profile', () => {
    it('updates partial profile data', async () => {
      const partialUpdate = {
        fullName: 'John Partially Updated'
      }

      // Mock successful partial update
      mockSupabaseClient.single.mockResolvedValue({
        data: { ...mockProfileData, ...partialUpdate },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(partialUpdate),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { PATCH } = await import('@/app/api/profile/route')
      const response = await PATCH(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.fullName).toBe('John Partially Updated')
    })

    it('handles conflicts with timestamps', async () => {
      const updateWithConflict = {
        fullName: 'Conflicted Update',
        lastModified: '2023-01-01T00:00:00Z' // Old timestamp
      }

      // Mock conflict detection
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...mockProfileData,
          lastModified: '2023-12-01T00:00:00Z' // Newer timestamp
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(updateWithConflict),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { PATCH } = await import('@/app/api/profile/route')
      const response = await PATCH(request)
      
      expect(response.status).toBe(409)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Conflict detected')
    })
  })

  describe('DELETE /api/profile', () => {
    it('soft deletes user profile', async () => {
      // Mock successful soft delete
      mockSupabaseClient.single.mockResolvedValue({
        data: { ...mockProfileData, deletedAt: new Date().toISOString() },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'DELETE'
      })

      const { DELETE } = await import('@/app/api/profile/route')
      const response = await DELETE(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('Profile deleted')
    })

    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'DELETE'
      })

      const { DELETE } = await import('@/app/api/profile/route')
      const response = await DELETE(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('Rate Limiting', () => {
    it('enforces rate limits', async () => {
      // Mock rate limit exceeded
      const { rateLimit } = await import('@/lib/utils/rate-limit')
      ;(rateLimit as jest.Mock).mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 900000
      })

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'GET'
      })

      const { GET } = await import('@/app/api/profile/route')
      const response = await GET(request)
      
      expect(response.status).toBe(429)
      
      const data = await response.json()
      expect(data.error).toContain('Too many requests')
    })
  })
})

describe('/api/profile/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('POST /api/profile/validate', () => {
    it('validates individual fields', async () => {
      const validationRequest = {
        field: 'email',
        value: 'john@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/profile/validate', {
        method: 'POST',
        body: JSON.stringify(validationRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/profile/validate/route')
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.isValid).toBe(true)
    })

    it('returns validation errors for invalid data', async () => {
      const invalidRequest = {
        field: 'email',
        value: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/profile/validate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/profile/validate/route')
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.isValid).toBe(false)
      expect(data.error).toContain('Invalid email')
    })

    it('validates UK phone numbers', async () => {
      const phoneValidationRequest = {
        field: 'phone',
        value: '+44 7123 456789'
      }

      const request = new NextRequest('http://localhost:3000/api/profile/validate', {
        method: 'POST',
        body: JSON.stringify(phoneValidationRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/profile/validate/route')
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.isValid).toBe(true)
    })

    it('validates website URLs', async () => {
      const urlValidationRequest = {
        field: 'website',
        value: 'https://example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/profile/validate', {
        method: 'POST',
        body: JSON.stringify(urlValidationRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/profile/validate/route')
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.isValid).toBe(true)
    })
  })
})

describe('/api/profile/sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('POST /api/profile/sync', () => {
    it('syncs onboarding data to profile', async () => {
      // Mock onboarding data
      const onboardingData = {
        personal: { firstName: 'John', lastName: 'Doe' },
        company: { name: 'Test Company' },
        contact: { email: 'john@example.com' }
      }

      // Mock fetching onboarding data
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: onboardingData,
        error: null
      })

      // Mock profile update
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockProfileData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile/sync', {
        method: 'POST'
      })

      const { POST } = await import('@/app/api/profile/sync/route')
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.synced).toBe(true)
    })

    it('detects and reports conflicts', async () => {
      // Mock existing profile with different data
      const existingProfile = {
        ...mockProfileData,
        email: 'existing@example.com'
      }

      const onboardingData = {
        contact: { email: 'different@example.com' }
      }

      // Mock existing profile fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: existingProfile,
        error: null
      })

      // Mock onboarding data fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: onboardingData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile/sync', {
        method: 'POST'
      })

      const { POST } = await import('@/app/api/profile/sync/route')
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.conflicts.length).toBeGreaterThan(0)
      expect(data.conflicts[0].field).toBe('email')
    })
  })
}) 