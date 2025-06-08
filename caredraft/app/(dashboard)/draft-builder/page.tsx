import { Metadata } from 'next'
import LazyDraftBuilder from '@/components/draft-builder/LazyDraftBuilder'

export const metadata: Metadata = {
  title: 'Draft Builder | CareDraft',
  description: 'AI-powered rich text editor for creating and editing tender proposals',
}

interface DraftBuilderPageProps {
  searchParams: { proposalId?: string }
}

export default function DraftBuilderPage({ searchParams }: DraftBuilderPageProps) {
  return <LazyDraftBuilder proposalId={searchParams.proposalId} />
} 