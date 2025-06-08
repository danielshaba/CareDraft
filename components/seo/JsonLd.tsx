import React from 'react';

interface JsonLdProps {
  data: Record<string, any> | Array<Record<string, any>>;
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdString = JSON.stringify(Array.isArray(data) ? data : [data], null, 2);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLdString,
      }}
    />
  );
}

// Convenience components for specific schema types
export function OrganizationJsonLd({ organization }: { organization: Record<string, any> }) {
  return <JsonLd data={organization} />;
}

export function ArticleJsonLd({ article }: { article: Record<string, any> }) {
  return <JsonLd data={article} />;
}

export function BreadcrumbJsonLd({ breadcrumbs }: { breadcrumbs: Record<string, any> }) {
  return <JsonLd data={breadcrumbs} />;
}

export function FAQJsonLd({ faq }: { faq: Record<string, any> }) {
  return <JsonLd data={faq} />;
}

export function WebsiteJsonLd({ website }: { website: Record<string, any> }) {
  return <JsonLd data={website} />;
} 