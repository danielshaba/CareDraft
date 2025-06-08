import { Metadata } from 'next';
import { pageMetadata } from '@/lib/services/seo-service';
import LazyDraftBuilder from '@/components/draft-builder/LazyDraftBuilder';

export const metadata: Metadata = pageMetadata.draftBuilder();

export default function DraftBuilderPage() {
  return <LazyDraftBuilder />;
} 