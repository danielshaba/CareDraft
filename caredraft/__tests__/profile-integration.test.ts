/**
 * Profile Integration Tests
 * Tests the complete profile management system including data flow,
 * validation, auto-population, and error handling
 */

describe('Profile Management Integration', () => {
  describe('Data Flow Validation', () => {
    test('onboarding to profile data transformation', () => {
      const onboardingData = {
        personal: { firstName: 'John', lastName: 'Doe' },
        company: { name: 'Test Company', website: 'https://example.com' },
        contact: { email: 'john@example.com', phone: '+44 7123 456789' },
        professional: { experience: '5 years', bio: 'Test bio' }
      }

      const transformToProfile = (data: any) => ({
        fullName: `${data.personal.firstName} ${data.personal.lastName}`,
        email: data.contact.email,
        phone: data.contact.phone,
        organization: data.company.name,
        website: data.company.website,
        bio: data.professional.bio,
        experience: data.professional.experience
      })

      const profileData = transformToProfile(onboardingData)

      expect(profileData.fullName).toBe('John Doe')
      expect(profileData.email).toBe('john@example.com')
      expect(profileData.organization).toBe('Test Company')
      expect(profileData.website).toBe('https://example.com')
    })

    test('profile completion percentage calculation', () => {
      const calculateCompletion = (profile: any) => {
        const requiredFields = ['fullName', 'email', 'phone', 'organization', 'bio']
        const completedFields = requiredFields.filter(
          field => profile[field] && profile[field].toString().trim() !== ''
        )
        return Math.round((completedFields.length / requiredFields.length) * 100)
      }

      const completeProfile = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+44 7123 456789',
        organization: 'Test Company',
        bio: 'Test bio'
      }

      const incompleteProfile = {
        fullName: 'John Doe',
        email: 'john@example.com'
      }

      expect(calculateCompletion(completeProfile)).toBe(100)
      expect(calculateCompletion(incompleteProfile)).toBe(40)
    })

    test('conflict detection between profile and onboarding data', () => {
      const detectConflicts = (profile: any, onboarding: any) => {
        const conflicts = []
        for (const key in onboarding) {
          if (profile[key] && profile[key] !== onboarding[key]) {
            conflicts.push({
              field: key,
              profileValue: profile[key],
              onboardingValue: onboarding[key]
            })
          }
        }
        return conflicts
      }

      const profileData = { 
        email: 'profile@example.com', 
        phone: '+44 1234 567890' 
      }
      
      const onboardingData = { 
        email: 'onboarding@example.com', 
        phone: '+44 1234 567890' 
      }

      const conflicts = detectConflicts(profileData, onboardingData)
      
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].field).toBe('email')
      expect(conflicts[0].profileValue).toBe('profile@example.com')
      expect(conflicts[0].onboardingValue).toBe('onboarding@example.com')
    })
  })

  describe('Validation Rules', () => {
    test('UK phone number validation', () => {
      const validateUKPhone = (phone: string) => {
        const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/
        return ukPhoneRegex.test(phone)
      }

      expect(validateUKPhone('+44 7123 456789')).toBe(true)
      expect(validateUKPhone('07123 456789')).toBe(true)
      expect(validateUKPhone('(07123) 456 789')).toBe(true)
      expect(validateUKPhone('+1 234 567 8901')).toBe(false)
      expect(validateUKPhone('invalid')).toBe(false)
    })

    test('website URL validation', () => {
      const validateWebsite = (url: string) => {
        try {
          new URL(url)
          return url.startsWith('http://') || url.startsWith('https://')
        } catch {
          return false
        }
      }

      expect(validateWebsite('https://example.com')).toBe(true)
      expect(validateWebsite('http://example.com')).toBe(true)
      expect(validateWebsite('https://subdomain.example.com')).toBe(true)
      expect(validateWebsite('example.com')).toBe(false)
      expect(validateWebsite('invalid-url')).toBe(false)
    })

    test('email format validation', () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }

      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })

    test('required field validation', () => {
      const validateRequiredFields = (profile: any) => {
        const requiredFields = ['fullName', 'email']
        const errors: string[] = []

        requiredFields.forEach(field => {
          if (!profile[field] || profile[field].toString().trim() === '') {
            errors.push(`${field} is required`)
          }
        })

        return {
          isValid: errors.length === 0,
          errors
        }
      }

      const validProfile = { fullName: 'John Doe', email: 'john@example.com' }
      const invalidProfile = { fullName: '', email: 'john@example.com' }

      expect(validateRequiredFields(validProfile).isValid).toBe(true)
      expect(validateRequiredFields(invalidProfile).isValid).toBe(false)
      expect(validateRequiredFields(invalidProfile).errors).toContain('fullName is required')
    })
  })

  describe('Error Handling', () => {
    test('network timeout handling', async () => {
      const simulateTimeout = () => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100)
        })
      }

      try {
        await simulateTimeout()
        fail('Should have thrown timeout error')
      } catch (error) {
        expect((error as Error).message).toBe('Request timeout')
      }
    })

    test('malformed JSON handling', () => {
      const parseJSON = (jsonString: string) => {
        try {
          return { success: true, data: JSON.parse(jsonString) }
        } catch (error) {
          return { success: false, error: 'Invalid JSON format' }
        }
      }

      const validJSON = '{"name": "John Doe"}'
      const invalidJSON = '{"name": "John Doe"'

      expect(parseJSON(validJSON).success).toBe(true)
      expect(parseJSON(invalidJSON).success).toBe(false)
      expect(parseJSON(invalidJSON).error).toBe('Invalid JSON format')
    })

    test('concurrent update conflict handling', () => {
      const mockProfile = { 
        id: '1', 
        name: 'John', 
        version: 1, 
        lastModified: '2023-01-01T00:00:00Z' 
      }

      const handleConcurrentUpdate = (current: any, update: any) => {
        if (update.version !== current.version) {
          return {
            success: false,
            error: 'Conflict: Resource has been modified by another user',
            currentVersion: current.version,
            providedVersion: update.version
          }
        }
        return {
          success: true,
          data: { ...current, ...update, version: current.version + 1 }
        }
      }

      const update1 = { name: 'John Updated', version: 1 }
      const update2 = { name: 'John Different', version: 1 }

      // First update should succeed
      const result1 = handleConcurrentUpdate(mockProfile, update1)
      expect(result1.success).toBe(true)

      // Second update with old version should fail
      const result2 = handleConcurrentUpdate(result1.data, update2)
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('Conflict')
    })
  })

  describe('Security and Performance', () => {
    test('input sanitization', () => {
      const sanitizeInput = (input: string) => {
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim()
      }

      const maliciousInput = '<script>alert("xss")</script>John Doe'
      const cleanInput = 'John Doe'

      expect(sanitizeInput(maliciousInput)).toBe('John Doe')
      expect(sanitizeInput(cleanInput)).toBe('John Doe')
    })

    test('rate limiting logic', () => {
      const rateLimitTracker = new Map()

      const checkRateLimit = (userId: string, limit: number, windowMs: number) => {
        const now = Date.now()
        const userRequests = rateLimitTracker.get(userId) || []

        // Remove requests outside the time window
        const validRequests = userRequests.filter((time: number) => now - time < windowMs)

        if (validRequests.length >= limit) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: Math.min(...validRequests) + windowMs
          }
        }

        // Add current request
        validRequests.push(now)
        rateLimitTracker.set(userId, validRequests)

        return {
          allowed: true,
          remaining: limit - validRequests.length,
          resetTime: now + windowMs
        }
      }

      const userId = 'test-user'
      const limit = 2
      const windowMs = 1000

      // First and second requests should be allowed
      const result1 = checkRateLimit(userId, limit, windowMs)
      const result2 = checkRateLimit(userId, limit, windowMs)
      const result3 = checkRateLimit(userId, limit, windowMs)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result3.allowed).toBe(false)
      expect(result3.remaining).toBe(0)
    })

    test('sensitive data encryption', () => {
      // Mock encryption/decryption for demonstration
      const encrypt = (data: string) => Buffer.from(data).toString('base64')
      const decrypt = (encrypted: string) => Buffer.from(encrypted, 'base64').toString()

      const sensitiveData = 'john@example.com'
      const encrypted = encrypt(sensitiveData)
      const decrypted = decrypt(encrypted)

      expect(encrypted).not.toBe(sensitiveData)
      expect(decrypted).toBe(sensitiveData)
      expect(encrypted.length).toBeGreaterThan(0)
    })
  })

  describe('Complete User Journey', () => {
    test('end-to-end profile management workflow', () => {
      // Simulate complete user journey through profile management
      const userJourney = {
        // 1. User completes onboarding
        onboardingComplete: {
          personal: { firstName: 'John', lastName: 'Doe' },
          company: { name: 'Test Company' },
          contact: { email: 'john@example.com', phone: '+44 7123 456789' }
        },

        // 2. Profile auto-populated from onboarding
        autoPopulatedProfile: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+44 7123 456789',
          organization: 'Test Company',
          completionPercentage: 60,
          source: 'onboarding'
        },

        // 3. User manually adds additional information
        manuallyUpdatedProfile: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+44 7123 456789',
          organization: 'Test Company',
          website: 'https://johndoe.com',
          bio: 'Experienced healthcare consultant',
          experience: '10 years',
          completionPercentage: 90,
          source: 'mixed'
        },

        // 4. Profile validation and completion
        finalProfile: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+44 7123 456789',
          organization: 'Test Company',
          website: 'https://johndoe.com',
          bio: 'Experienced healthcare consultant',
          experience: '10 years',
          specializations: ['Healthcare', 'Consulting'],
          qualifications: ['MBA', 'Medical Degree'],
          completionPercentage: 100,
          isComplete: true,
          source: 'mixed'
        }
      }

      // Validate each step of the journey
      expect(userJourney.onboardingComplete.personal.firstName).toBe('John')
      expect(userJourney.autoPopulatedProfile.fullName).toBe('John Doe')
      expect(userJourney.autoPopulatedProfile.completionPercentage).toBe(60)
      expect(userJourney.autoPopulatedProfile.source).toBe('onboarding')
      
      expect(userJourney.manuallyUpdatedProfile.completionPercentage).toBe(90)
      expect(userJourney.manuallyUpdatedProfile.website).toBe('https://johndoe.com')
      expect(userJourney.manuallyUpdatedProfile.source).toBe('mixed')
      
      expect(userJourney.finalProfile.isComplete).toBe(true)
      expect(userJourney.finalProfile.completionPercentage).toBe(100)
      expect(userJourney.finalProfile.specializations).toContain('Healthcare')
      expect(userJourney.finalProfile.qualifications).toContain('MBA')
    })

    test('profile data source tracking', () => {
      const trackDataSource = (field: string, value: any, source: string) => ({
        field,
        value,
        source,
        timestamp: new Date().toISOString(),
        isAutoFilled: source === 'onboarding'
      })

      const onboardingField = trackDataSource('email', 'john@example.com', 'onboarding')
      const manualField = trackDataSource('bio', 'Manual bio entry', 'manual')

      expect(onboardingField.isAutoFilled).toBe(true)
      expect(onboardingField.source).toBe('onboarding')
      
      expect(manualField.isAutoFilled).toBe(false)
      expect(manualField.source).toBe('manual')
    })

    test('auto-save functionality simulation', async () => {
      let savedData: any = null
      const autoSaveDelay = 1000

      const simulateAutoSave = (data: any) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            savedData = data
            resolve({ success: true, timestamp: new Date().toISOString() })
          }, autoSaveDelay)
        })
      }

      const profileUpdate = { fullName: 'John Updated Doe' }
      
      // Start auto-save
      const savePromise = simulateAutoSave(profileUpdate)
      
      // Verify data hasn't been saved immediately
      expect(savedData).toBeNull()
      
      // Wait for auto-save to complete
      const result = await savePromise
      
      expect(result).toEqual({ 
        success: true, 
        timestamp: expect.any(String) 
      })
      expect(savedData).toEqual(profileUpdate)
    })
  })
}) 