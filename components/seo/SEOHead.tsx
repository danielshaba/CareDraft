import React from 'react';
import Head from 'next/head';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_CONFIG } from '@/lib/services/seo-service';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  canonical?: string;
  structuredData?: Record<string, any>[];
  breadcrumbs?: Record<string, any>;
}

export function SEOHead({
  title,
  description = SITE_CONFIG.description,
  keywords = SITE_CONFIG.keywords,
  ogImage = SITE_CONFIG.ogImage,
  ogType = 'website',
  noIndex = false,
  canonical,
  structuredData = [],
  breadcrumbs
}: SEOHeadProps) {
  const pageTitle = title 
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.title;

  const ogImageUrl = ogImage.startsWith('http') 
    ? ogImage 
    : `${SITE_CONFIG.url}${ogImage}`;

  const canonicalUrl = canonical 
    ? (canonical.startsWith('http') ? canonical : `${SITE_CONFIG.url}${canonical}`)
    : undefined;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <meta name="author" content={SITE_CONFIG.author} />
        <meta name="creator" content={SITE_CONFIG.author} />
        <meta name="publisher" content={SITE_CONFIG.name} />
        
        {/* Robots */}
        <meta 
          name="robots" 
          content={noIndex ? 'noindex,nofollow' : 'index,follow'} 
        />
        
        {/* Canonical URL */}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        
        {/* Open Graph */}
        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl || SITE_CONFIG.url} />
        <meta property="og:site_name" content={SITE_CONFIG.name} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={pageTitle} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
        <meta name="twitter:creator" content={SITE_CONFIG.twitterHandle} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B9C9C" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      
      {/* Structured Data */}
      {structuredData.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      
      {/* Breadcrumbs */}
      {breadcrumbs && <JsonLd data={breadcrumbs} />}
    </>
  );
}

// Hook for dynamic SEO updates
export function useSEO({
  title,
  description,
  keywords,
  ogImage,
  ogType,
  noIndex,
  canonical,
  structuredData,
  breadcrumbs
}: SEOHeadProps) {
  React.useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | ${SITE_CONFIG.name}`;
    }
    
    // Update meta description
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
    
    // Update canonical URL
    if (canonical) {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      const canonicalUrl = canonical.startsWith('http') 
        ? canonical 
        : `${SITE_CONFIG.url}${canonical}`;
      
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonicalUrl);
      } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonicalUrl;
        document.head.appendChild(link);
      }
    }
  }, [title, description, canonical]);
} 