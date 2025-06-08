import { NextRequest } from 'next/server'

// Mock the dependencies before importing the modules
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/services/organization-service', () => ({
  organizationService: {
    getUserOrganizations: jest.fn(),
    createOrganization: jest.fn()
  }
}))

// Mock the error utilities to ensure they return proper error responses
jest.mock('@/lib/utils/errors', () => ({
  AuthenticationError: class AuthenticationError extends Error {
    code = 'AUTHENTICATION_ERROR'
    statusCode = 401
    constructor(message: string) {
      super(message)
    }
  },
  getErrorResponse: jest.fn((error: unknown) => ({
    success: false,
    error: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN_ERROR'
  })),
  getErrorStatusCode: jest.fn((error: unknown) => error.statusCode || 500)
}))

// Import after mocking
import { GET, POST } from '@/app/api/organizations/route'
import { createClient } from '@/lib/supabase'
import { organizationService } from '@/lib/services/organization-service'
import type { Organization, OrganizationSettings } from '@/lib/services/organization-service'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockOrganizationService = organizationService as jest.Mocked<typeof organizationService>

describe('/api/organizations Integration Tests', () => {
  let mockSupabase: unknown
  let mockRequest: NextRequest

  const mockOrganizationSettings: OrganizationSettings = {
    branding: {
      primary_color: '#000000',
      secondary_color: '#ffffff'
    },
    features: {
      research_sessions_enabled: true,
      compliance_tracking_enabled: true,
      advanced_analytics_enabled: false,
      api_access_enabled: false,
      sso_enabled: false
    },
    limits: {
      max_users: 10,
      max_proposals: 100,
      max_storage_gb: 5,
      max_api_calls_per_month: 1000
    },
    workflow: {
      require_approval_for_proposals: false,
      auto_archive_after_days: 90
    },
    notifications: {
      system_announcements: true,
      feature_updates: true,
      security_alerts: true
    }
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      }
    }
    mockCreateClient.mockReturnValue(mockSupabase)

    // Mock request
    mockRequest = {
      json: jest.fn(),
      url: 'http://localhost:3000/api/organizations'
    } as any
  })

  describe('GET /api/organizations', () => {
    it('should return user organizations when authenticated', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockOrganizations: Organization[] = [
        {
          id: 'org-1',
          name: 'Test Org 1',
          slug: 'test-org-1',
          settings: mockOrganizationSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 'user-123'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockOrganizationService.getUserOrganizations.mockResolvedValue(mockOrganizations)

      // Act
      const response = await GET(mockRequest)
      
      // Ensure response is defined before accessing properties
      expect(response).toBeDefined()
      
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        data: mockOrganizations
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      // Act
      const response = await GET(mockRequest)
      
      // Ensure response is defined
      expect(response).toBeDefined()
      
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
    })

    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockOrganizationService.getUserOrganizations.mockRejectedValue(
        new Error('Database connection failed')
      )

      // Act
      const response = await GET(mockRequest)
      
      // Ensure response is defined
      expect(response).toBeDefined()
      
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })
  })

  describe('POST /api/organizations', () => {
    it('should create organization when valid data provided', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const organizationData = {
        name: 'New Organization',
        slug: 'new-organization',
        description: 'A test organization'
      }
      const createdOrganization: Organization = {
        id: 'org-123',
        ...organizationData,
        settings: mockOrganizationSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: mockUser.id
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockRequest.json = jest.fn().mockResolvedValue(organizationData)
      mockOrganizationService.createOrganization.mockResolvedValue(createdOrganization)

      // Act
      const response = await POST(mockRequest)
      
      // Ensure response is defined
      expect(response).toBeDefined()
      
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(responseData).toEqual({
        success: true,
        data: createdOrganization
      })
    })

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const invalidData = { description: 'Missing name and slug' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockRequest.json = jest.fn().mockResolvedValue(invalidData)

      // Act
      const response = await POST(mockRequest)
      
      // Ensure response is defined
      expect(response).toBeDefined()
      
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Name and slug are required')
    })

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      // Act
      const response = await POST(mockRequest)
      
      // Ensure response is defined
      expect(response).toBeDefined()
      
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
    })
  })
})
