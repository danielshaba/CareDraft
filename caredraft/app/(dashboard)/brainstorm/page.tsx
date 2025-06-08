import { Metadata } from 'next'
import { BrainstormInterface } from '@/components/brainstorm/BrainstormInterface'

export const metadata: Metadata = {
  title: 'Brainstorm | CareDraft',
  description: 'AI-powered idea generation for tender proposals',
}

export default function BrainstormPage() {
  return <BrainstormInterface />
} 