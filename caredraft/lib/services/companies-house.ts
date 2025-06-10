// Companies House API integration for UK company data
// API documentation: https://developer-specs.company-information.service.gov.uk/

export interface CompaniesHouseCompany {
  company_number: string
  title: string
  company_type: string
  company_status: string
  date_of_creation?: string
  address_snippet?: string
  description?: string
  description_identifier?: string[]
  address: {
    address_line_1?: string
    address_line_2?: string
    care_of?: string
    country?: string
    locality?: string
    po_box?: string
    postal_code?: string
    premises?: string
    region?: string
  }
  snippet?: string
  matches?: {
    title?: number[]
    snippet?: number[]
  }
}

export interface CompaniesHouseSearchResponse {
  etag: string
  hits: number
  items: CompaniesHouseCompany[]
  items_per_page: number
  kind: string
  page_number: number
  start_index: number
  total_results: number
}

interface CompaniesHouseErrorData {
  error: string
  message: string
  statusCode: number
}

class CompaniesHouseService {
  private readonly baseUrl = 'https://api.company-information.service.gov.uk'
  private readonly apiKey: string

  constructor() {
    // Companies House API key should be set in environment variables
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('Companies House API key not configured. Company autocomplete will be disabled.')
    }
  }

  /**
   * Search for companies by name
   */
  async searchCompanies(query: string, itemsPerPage = 20): Promise<CompaniesHouseSearchResponse> {
    if (!this.apiKey) {
      throw new Error('Companies House API key not configured')
    }

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long')
    }

    const params = new URLSearchParams({
      q: query.trim(),
      items_per_page: itemsPerPage.toString(),
      start_index: '0'
    })

    const response = await fetch(`${this.baseUrl}/search/companies?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new CompaniesHouseError({
        error: 'API_ERROR',
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      })
    }

    return response.json()
  }

  /**
   * Get detailed company information by company number
   */
  async getCompanyDetails(companyNumber: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Companies House API key not configured')
    }

    if (!companyNumber) {
      throw new Error('Company number is required')
    }

    const response = await fetch(`${this.baseUrl}/company/${companyNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new CompaniesHouseError({
        error: 'API_ERROR',
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      })
    }

    return response.json()
  }

  /**
   * Format company address for display
   */
  formatAddress(address: CompaniesHouseCompany['address']): string {
    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Convert Companies House address to our internal format
   */
  convertAddress(address: CompaniesHouseCompany['address']) {
    return {
      line1: [address.premises, address.address_line_1].filter(Boolean).join(' ') || '',
      line2: address.address_line_2 || '',
      city: address.locality || '',
      postcode: address.postal_code || '',
      country: address.country || 'United Kingdom'
    }
  }

  /**
   * Check if the service is available (API key is configured)
   */
  isAvailable(): boolean {
    return !!this.apiKey
  }
}

// Custom error class for Companies House errors
class CompaniesHouseError extends Error {
  public statusCode: number
  public error: string

  constructor(data: CompaniesHouseErrorData) {
    super(data.message)
    this.name = 'CompaniesHouseError'
    this.error = data.error
    this.statusCode = data.statusCode
  }
}

// Export singleton instance
export const companiesHouseService = new CompaniesHouseService()

// Export utility functions for client-side use (without API key)
export const formatCompanyName = (company: CompaniesHouseCompany): string => {
  return company.title
}

export const formatCompanyDescription = (company: CompaniesHouseCompany): string => {
  if (company.description) {
    return company.description
  }
  
  const parts = [
    company.company_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    company.company_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  ].filter(Boolean)
  
  return parts.join(' • ')
}

export { CompaniesHouseError } 