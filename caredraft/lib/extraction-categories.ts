import { 
  Target, 
  CheckSquare, 
  Calendar, 
  Heart, 
  Users, 
  ClipboardList,
  LucideIcon 
} from 'lucide-react'
import { ExtractionCategory } from '@/components/shared/SmartExtractionButton'

export const EXTRACTION_CATEGORIES: ExtractionCategory[] = [
  {
    id: 'commissioners-priorities',
    label: "Commissioner's Priorities",
    description: 'Extract key priorities, objectives, and strategic goals outlined by the commissioning organization',
    icon: Target,
    color: {
      background: 'bg-brand-50',
      text: 'text-brand-900',
      icon: 'text-brand-600',
      hover: 'hover:bg-brand-50 hover:border-brand-300'
    }
  },
  {
    id: 'compliance-requirements',
    label: 'Compliance Requirements',
    description: 'Identify mandatory regulations, standards, and legal requirements that must be met',
    icon: CheckSquare,
    color: {
      background: 'bg-red-50',
      text: 'text-red-900',
      icon: 'text-red-600',
      hover: 'hover:bg-red-50 hover:border-red-300'
    }
  },
  {
    id: 'dates-timelines',
    label: 'Dates & Timelines',
    description: 'Extract important dates, deadlines, milestones, and project timelines',
    icon: Calendar,
    color: {
      background: 'bg-purple-50',
      text: 'text-purple-900',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-50 hover:border-purple-300'
    }
  },
  {
    id: 'social-value-criteria',
    label: 'Social Value Criteria',
    description: 'Identify social value requirements, community benefits, and local impact expectations',
    icon: Heart,
    color: {
      background: 'bg-pink-50',
      text: 'text-pink-900',
      icon: 'text-pink-600',
      hover: 'hover:bg-pink-50 hover:border-pink-300'
    }
  },
  {
    id: 'tupe-requirements',
    label: 'TUPE Requirements',
    description: 'Extract staff transfer obligations, pension arrangements, and employment continuity requirements',
    icon: Users,
    color: {
      background: 'bg-orange-50',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      hover: 'hover:bg-orange-50 hover:border-orange-300'
    }
  },
  {
    id: 'evaluation-criteria',
    label: 'Evaluation Criteria',
    description: 'Identify scoring methodology, weighting factors, and assessment criteria for tender evaluation',
    icon: ClipboardList,
    color: {
      background: 'bg-green-50',
      text: 'text-green-900',
      icon: 'text-green-600',
      hover: 'hover:bg-green-50 hover:border-green-300'
    }
  }
]

/**
 * Get a specific extraction category by its ID
 */
export function getExtractionCategory(categoryId: string): ExtractionCategory | undefined {
  return EXTRACTION_CATEGORIES.find(category => category.id === categoryId)
}

/**
 * Get all extraction category IDs
 */
export function getExtractionCategoryIds(): string[] {
  return EXTRACTION_CATEGORIES.map(category => category.id)
}

/**
 * Validate if category ID exists
 */
export function isValidCategoryId(id: string): boolean {
  return EXTRACTION_CATEGORIES.some(category => category.id === id)
} 