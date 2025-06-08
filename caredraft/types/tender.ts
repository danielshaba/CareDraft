// Tender Details Types
export interface TenderDetails {
  id?: string
  tenderName: string
  tenderReference: string
  issuingAuthority: string
  releaseDate: Date | null
  submissionDeadline: Date | null
  estimatedContractValue: number | null
  contractDuration: ContractDuration
  serviceType: ServiceType
  evaluationCriteria: EvaluationCriteria
  wordLimits: WordLimitSection[]
  createdAt?: Date
  updatedAt?: Date
}

// Contract Duration
export interface ContractDuration {
  value: number
  unit: 'months' | 'years'
}

// Service Types
export type ServiceType = 
  | 'residential'
  | 'domiciliary'
  | 'nursing'
  | 'respite'
  | 'day_care'
  | 'supported_living'
  | 'other'

export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'residential', label: 'Residential Care' },
  { value: 'domiciliary', label: 'Domiciliary Care' },
  { value: 'nursing', label: 'Nursing Care' },
  { value: 'respite', label: 'Respite Care' },
  { value: 'day_care', label: 'Day Care' },
  { value: 'supported_living', label: 'Supported Living' },
  { value: 'other', label: 'Other' },
]

// Evaluation Criteria
export interface EvaluationCriteria {
  quality: number
  price: number
  socialValue: number
  experience: number
}

// Word Limit Configuration
export interface WordLimitSection {
  id: string
  sectionName: string
  wordLimit: number
  description?: string
}

// UK Councils/Authorities
export const UK_COUNCILS = [
  'Birmingham City Council',
  'Leeds City Council',
  'Sheffield City Council',
  'Bradford Metropolitan District Council',
  'Liverpool City Council',
  'Manchester City Council',
  'Bristol City Council',
  'Kirklees Council',
  'Newcastle upon Tyne City Council',
  'Nottingham City Council',
  'County Durham',
  'Wiltshire Council',
  'North Yorkshire County Council',
  'Buckinghamshire Council',
  'Kent County Council',
  'Essex County Council',
  'Hampshire County Council',
  'Surrey County Council',
  'West Sussex County Council',
  'Lancashire County Council',
  'Staffordshire County Council',
  'Derbyshire County Council',
  'Cheshire East Council',
  'Cheshire West and Chester Council',
  'Warwickshire County Council',
  'Leicestershire County Council',
  'Lincolnshire County Council',
  'Northamptonshire',
  'Oxfordshire County Council',
  'Gloucestershire County Council',
  'Somerset Council',
  'Devon County Council',
  'Cornwall Council',
  'Dorset Council',
  'Hertfordshire County Council',
  'Bedfordshire',
  'Cambridgeshire County Council',
  'Norfolk County Council',
  'Suffolk County Council',
  'Cumbria County Council',
  'Northumberland County Council',
  'Tyne and Wear',
  'County of Herefordshire',
  'Worcestershire County Council',
  'Shropshire Council',
  'Telford and Wrekin Council',
  'Stoke-on-Trent City Council',
  'Derby City Council',
  'Leicester City Council',
  'Rutland County Council',
  'Northampton Borough Council',
  'Peterborough City Council',
  'Luton Borough Council',
  'Southend-on-Sea Borough Council',
  'Thurrock Council',
  'Medway Council',
  'Brighton and Hove City Council',
  'Portsmouth City Council',
  'Southampton City Council',
  'Isle of Wight Council',
  'Reading Borough Council',
  'Slough Borough Council',
  'West Berkshire Council',
  'Windsor and Maidenhead',
  'Wokingham Borough Council',
  'Milton Keynes Council',
  'Swindon Borough Council',
  'Bath and North East Somerset Council',
  'North Somerset Council',
  'South Gloucestershire Council',
  'Plymouth City Council',
  'Torbay Council',
  'Bournemouth, Christchurch and Poole Council',
  'Blackburn with Darwen Borough Council',
  'Blackpool Council',
  'Halton Borough Council',
  'Warrington Borough Council',
  'Darlington Borough Council',
  'Hartlepool Borough Council',
  'Middlesbrough Council',
  'Redcar and Cleveland Borough Council',
  'Stockton-on-Tees Borough Council',
  'Kingston upon Hull City Council',
  'East Riding of Yorkshire Council',
  'North East Lincolnshire Council',
  'North Lincolnshire Council',
  'York City Council',
] as const

// Form validation schemas and utilities
export interface TenderDetailsFormErrors {
  tenderName?: string
  tenderReference?: string
  issuingAuthority?: string
  releaseDate?: string
  submissionDeadline?: string
  estimatedContractValue?: string
  contractDuration?: string
  serviceType?: string
  evaluationCriteria?: string
  wordLimits?: string
}

// Form state management
export interface TenderDetailsFormState {
  data: Partial<TenderDetails>
  errors: TenderDetailsFormErrors
  isLoading: boolean
  isDirty: boolean
  isValid: boolean
}

// Default values
export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria = {
  quality: 40,
  price: 30,
  socialValue: 20,
  experience: 10,
}

export const DEFAULT_CONTRACT_DURATION: ContractDuration = {
  value: 1,
  unit: 'years',
}

export const DEFAULT_TENDER_DETAILS: Partial<TenderDetails> = {
  tenderName: '',
  tenderReference: '',
  issuingAuthority: '',
  releaseDate: null,
  submissionDeadline: null,
  estimatedContractValue: null,
  contractDuration: DEFAULT_CONTRACT_DURATION,
  serviceType: 'residential',
  evaluationCriteria: DEFAULT_EVALUATION_CRITERIA,
  wordLimits: [],
} 