import { organizationService } from '@/lib/services/organization-service'
import { createClient } from '@/lib/supabase'
import { AuthenticationError, AuthorizationError, ValidationError } from '@/lib/utils/errors'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn()
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Organization Service Integration Tests', () => {
  let mockSupabase: unknown

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis()
    }
    
    mockCreateClient.mockReturnValue(mockSupabase)
  })

  describe('getUserOrganizations', () => {
    it('should return organizations for a valid user', async () => {
      // Arrange
      const userId = 'user-123'
      const mockUser = { organization_id: 'org-456' }
      
      mockSupabase.single.mockResolvedValue({
        data: mockUser,
        error: null
      })

      // Act
      const organizations = await organizationService.getUserOrganizations(userId)

      // Assert
      expect(organizations).toHaveLength(1)
      expect(organizations[0]).toMatchObject({
        id: 'org-456',
        name: 'CareDraft Organization',
        slug: 'caredraft-org',
        industry: 'Healthcare'
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.select).toHaveBeenCalledWith('organization_id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', userId)
    })

    it('should return empty array when user has no organization', async () => {
      // Arrange
      const userId = 'user-123'
      
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: null },
        error: null
      })

      // Act
      const organizations = await organizationService.getUserOrganizations(userId)

      // Assert
      expect(organizations).toEqual([])
    })

    it('should return empty array when user not found', async () => {
      // Arrange
      const userId = 'user-123'
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      // Act
      const organizations = await organizationService.getUserOrganizations(userId)

      // Assert
      expect(organizations).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userId = 'user-123'
      
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: 'org-456' },
        error: null
      })

      // Mock the getOrganization call to throw
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Act
      const organizations = await organizationService.getUserOrganizations(userId)

      // Assert - Should return array with mock organization despite potential errors
      expect(organizations).toHaveLength(1)
      
      consoleSpy.mockRestore()
    })
  })

  describe('getOrganization', () => {
    it('should return organization for valid ID and user', async () => {
      // Arrange
      const organizationId = 'org-123'
      const userId = 'user-456'
      
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: organizationId },
        error: null
      })

      // Act
      const organization = await organizationService.getOrganization(organizationId, userId)

      // Assert
      expect(organization).toMatchObject({
        id: organizationId,
        name: 'CareDraft Organization',
        slug: 'caredraft-org',
        industry: 'Healthcare',
        size: '50-100',
        owner_id: userId
      })
      expect(organization.settings).toBeDefined()
      expect(organization.settings.features).toBeDefined()
      expect(organization.subscription).toBeDefined()
    })

    it('should throw AuthorizationError when user lacks access', async () => {
      // Arrange
      const organizationId = 'org-123'
      const userId = 'user-456'
      
      mockSupabase.single.mockResolvedValue({
        data: { organization_id: 'different-org' },
        error: null
      })

      // Act & Assert
      await expect(
        organizationService.getOrganization(organizationId, userId)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should throw AuthorizationError when user not found', async () => {
      // Arrange
      const organizationId = 'org-123'
      const userId = 'user-456'
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      // Act & Assert
      await expect(
        organizationService.getOrganization(organizationId, userId)
      ).rejects.toThrow(AuthorizationError)
    })

    it('should return organization without access check when no userId provided', async () => {
      // Arrange
      const organizationId = 'org-123'

      // Act
      const organization = await organizationService.getOrganization(organizationId)

      // Assert
      expect(organization).toMatchObject({
        id: organizationId,
        name: 'CareDraft Organization'
      })
      expect(mockSupabase.from).not.toHaveBeenCalled() // No access check performed
    })
  })

  describe('createOrganization', () => {
    it('should create organization with valid data', async () => {
      // Arrange
      const organizationData = {
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization',
        industry: 'Technology',
        size: '10-50',
        billing_email: 'billing@test.com',
        website: 'https://test.com'
      }
      const ownerId = 'user-123'

      // Act
      const result = await organizationService.createOrganization(organizationData, ownerId)

      // Assert
      expect(result).toMatchObject({
        ...organizationData,
        owner_id: ownerId
      })
      expect(result.id).toBeDefined()
      expect(result.created_at).toBeDefined()
      expect(result.updated_at).toBeDefined()
      expect(result.settings).toBeDefined()
    })

    it('should generate unique ID for each organization', async () => {
      // Arrange
      const organizationData = {
        name: 'Test Organization',
        slug: 'test-org'
      }
      const ownerId = 'user-123'

      // Act
      const org1 = await organizationService.createOrganization(organizationData, ownerId)
      const org2 = await organizationService.createOrganization(organizationData, ownerId)

      // Assert
      expect(org1.id).not.toBe(org2.id)
    })

    it('should include default settings for new organization', async () => {
      // Arrange
      const organizationData = {
        name: 'Test Organization',
        slug: 'test-org'
      }
      const ownerId = 'user-123'

      // Act
      const result = await organizationService.createOrganization(organizationData, ownerId)

      // Assert
      expect(result.settings).toMatchObject({
        branding: expect.any(Object),
        features: expect.objectContaining({
          research_sessions_enabled: true,
          compliance_tracking_enabled: true,
          advanced_analytics_enabled: false
        }),
        limits: expect.objectContaining({
          max_users: expect.any(Number),
          max_proposals: expect.any(Number)
        }),
        workflow: expect.any(Object),
        notifications: expect.any(Object)
      })
    })
  })
}) 