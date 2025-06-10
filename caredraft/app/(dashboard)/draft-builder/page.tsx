import { Metadata } from 'next'
import LazyDraftBuilder from '@/components/draft-builder/LazyDraftBuilder'

export const metadata: Metadata = {
  title: 'Draft Builder | CareDraft',
  description: 'AI-powered rich text editor for creating and editing tender proposals',
}

interface DraftBuilderPageProps {
  searchParams: Promise<{ proposalId?: string }>
}

export default async function DraftBuilderPage({ searchParams }: DraftBuilderPageProps) {
  const resolvedSearchParams = await searchParams
  return <LazyDraftBuilder proposalId={resolvedSearchParams.proposalId} />
} 