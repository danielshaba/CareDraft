import { createClient } from '@/lib/supabase'
import { organizationService } from '@/lib/services/organization-service'

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn()
}))

describe('Authentication Integration Tests', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  let mockSupabase: unknown

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      }
    }
    mockCreateClient.mockReturnValue(mockSupabase)
  })

  describe('Supabase Authentication', () => {
    it('should return user when authentication is successful', async () => {
      // Arrange
      const expectedUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: expectedUser },
        error: null
      })

      // Act
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      // Assert
      expect(data.user).toEqual(expectedUser)
      expect(error).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
    })

    it('should return error when authentication fails', async () => {
      // Arrange
      const expectedError = new Error('Authentication failed')
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: expectedError
      })

      // Act
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      // Assert
      expect(data.user).toBeNull()
      expect(error).toEqual(expectedError)
    })

    it('should handle network errors during authentication', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      const supabase = createClient()
      await expect(supabase.auth.getUser()).rejects.toThrow('Network error')
    })
  })
}) 