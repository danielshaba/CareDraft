import { useState, useCallback } from 'react'

export interface SmartExtractionResult {
  id: string
  content: string
  confidence: number
  sourceText?: string
  category: string
}

export interface SmartExtractionResponse {
  success: boolean
  results: SmartExtractionResult[]
  error?: string
  processingTime: number
}

export function useSmartExtraction() {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractFromText = useCallback(async (
    text: string,
    categoryId: string,
    documentName: string
  ): Promise<SmartExtractionResponse> => {
    setIsExtracting(true)
    setError(null)
    
    const startTime = Date.now()

    try {
      // TODO: Replace with actual AI API call
      // For now, we'll use enhanced mock data that's more realistic
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      const mockResults = generateMockResults(categoryId, text, documentName)
      
      return {
        success: true,
        results: mockResults,
        processingTime: Date.now() - startTime
      }
    } catch {
      const errorMessage = err instanceof Error ? err.message : 'Smart extraction failed'
      setError(errorMessage)
      
      return {
        success: false,
        results: [],
        error: errorMessage,
        processingTime: Date.now() - startTime
      }
    } finally {
      setIsExtracting(false)
    }
  }, [])

  return {
    extractFromText,
    isExtracting,
    error,
    clearError: () => setError(null)
  }
}

// Enhanced mock data generator for more realistic results
function generateMockResults(categoryId: string, text: string, documentName: string): SmartExtractionResult[] {
  const wordCount = text.split(' ').length
  const confidence = 0.75 + Math.random() * 0.2 // 75-95% confidence
  
  const mockData: Record<string, SmartExtractionResult[]> = {
    'commissioners-priorities': [
      {
        id: `${categoryId}-1`,
        content: 'Improve quality of care and outcomes for service users through evidence-based practices and continuous improvement initiatives.',
        confidence: confidence,
        sourceText: 'Extracted from section 2.1 of the tender document',
        category: categoryId
      },
      {
        id: `${categoryId}-2`,
        content: 'Achieve value for money through efficient service delivery while maintaining high standards of care provision.',
        confidence: confidence - 0.1,
        sourceText: 'Identified in strategic objectives section',
        category: categoryId
      },
      {
        id: `${categoryId}-3`,
        content: 'Promote partnership working with local stakeholders, including NHS trusts, voluntary sector organizations, and community groups.',
        confidence: confidence + 0.05,
        sourceText: 'Referenced in collaboration requirements',
        category: categoryId
      }
    ],
    'compliance-requirements': [
      {
        id: `${categoryId}-1`,
        content: 'All staff must hold current DBS (Disclosure and Barring Service) checks appropriate to their role and responsibilities.',
        confidence: confidence + 0.1,
        sourceText: 'Mandatory requirement in section 4.2',
        category: categoryId
      },
      {
        id: `${categoryId}-2`,
        content: 'Services must comply with Care Quality Commission (CQC) regulations and maintain current registration status.',
        confidence: confidence,
        sourceText: 'Regulatory compliance section',
        category: categoryId
      },
      {
        id: `${categoryId}-3`,
        content: 'Data protection and information governance must meet GDPR and NHS Information Governance standards.',
        confidence: confidence - 0.05,
        sourceText: 'Information security requirements',
        category: categoryId
      }
    ],
    'dates-timelines': [
      {
        id: `${categoryId}-1`,
        content: 'Tender submission deadline: 5:00 PM on Friday, 15th March 2024.',
        confidence: confidence + 0.15,
        sourceText: 'Key dates section',
        category: categoryId
      },
      {
        id: `${categoryId}-2`,
        content: 'Service commencement date: Monday, 1st April 2024, with full implementation by 30th April 2024.',
        confidence: confidence + 0.1,
        sourceText: 'Implementation timeline',
        category: categoryId
      },
      {
        id: `${categoryId}-3`,
        content: 'Contract duration: 3 years with option to extend for additional 2 years subject to performance review.',
        confidence: confidence,
        sourceText: 'Contract terms section',
        category: categoryId
      }
    ],
    'social-value-criteria': [
      {
        id: `${categoryId}-1`,
        content: 'Minimum 10% of contract value to be spent with local SMEs and voluntary sector organizations within the commissioning area.',
        confidence: confidence,
        sourceText: 'Social value requirements',
        category: categoryId
      },
      {
        id: `${categoryId}-2`,
        content: 'Create minimum 5 new employment opportunities for local residents, including apprenticeships and work experience placements.',
        confidence: confidence + 0.05,
        sourceText: 'Employment and skills section',
        category: categoryId
      },
      {
        id: `${categoryId}-3`,
        content: 'Demonstrate environmental sustainability through carbon reduction initiatives and sustainable procurement practices.',
        confidence: confidence - 0.1,
        sourceText: 'Environmental impact requirements',
        category: categoryId
      }
    ],
    'tupe-requirements': [
      {
        id: `${categoryId}-1`,
        content: 'TUPE regulations apply to 47 existing staff members who will transfer to the new provider on current terms and conditions.',
        confidence: confidence + 0.1,
        sourceText: 'Staff transfer section',
        category: categoryId
      },
      {
        id: `${categoryId}-2`,
        content: 'Pension arrangements must be maintained for transferring staff with equivalent benefits to current Local Government Pension Scheme.',
        confidence: confidence,
        sourceText: 'Pension transfer requirements',
        category: categoryId
      },
      {
        id: `${categoryId}-3`,
        content: 'Consultation period with affected staff and trade unions must commence minimum 30 days before service transfer date.',
        confidence: confidence - 0.05,
        sourceText: 'Consultation requirements',
        category: categoryId
      }
    ],
    'evaluation-criteria': [
      {
        id: `${categoryId}-1`,
        content: 'Technical quality (60%): Service delivery model, staffing approach, quality assurance, and innovation proposals.',
        confidence: confidence + 0.1,
        sourceText: 'Evaluation methodology section',
        category: categoryId
      },
      {
        id: `${categoryId}-2`,
        content: 'Commercial (30%): Value for money assessment including whole life costs and efficiency savings proposals.',
        confidence: confidence + 0.05,
        sourceText: 'Commercial evaluation criteria',
        category: categoryId
      },
      {
        id: `${categoryId}-3`,
        content: 'Social value (10%): Local economic impact, employment creation, and community benefit delivery.',
        confidence: confidence,
        sourceText: 'Social value scoring',
        category: categoryId
      }
    ]
  }

  // Return results for the requested category, or empty array if not found
  const results = mockData[categoryId] || []
  
  // Adjust confidence based on document length (longer documents = potentially more accurate)
  return results.map(result => ({
    ...result,
    confidence: Math.min(0.95, result.confidence + (wordCount > 1000 ? 0.05 : 0))
  }))
} 