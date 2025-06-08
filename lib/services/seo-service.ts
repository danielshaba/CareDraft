import { Metadata } from 'next';

// Base site configuration
export const SITE_CONFIG = {
  name: 'CareDraft',
  title: 'CareDraft - AI-Powered Tender Response Platform',
  description: 'Streamline your tender response process with AI-powered research, document analysis, and proposal building tools.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://caredraft.com',
  ogImage: '/images/og-image.png',
  twitterHandle: '@caredraft',
  author: 'CareDraft Team',
  keywords: [
    'tender response',
    'proposal building',
    'AI research',
    'document analysis',
    'compliance management',
    'tender management',
    'procurement',
    'business development'
  ],
} as const;

// Organization structured data
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}/images/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+44-20-1234-5678',
    contactType: 'customer service',
    availableLanguage: 'English'
  },
  sameAs: [
    'https://twitter.com/caredraft',
    'https://linkedin.com/company/caredraft'
  ]
};

// Software application schema
export const SOFTWARE_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
    description: 'Free trial available'
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_CONFIG.name
  }
};

// SEO metadata generation utilities
export interface SEOParams {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  canonical?: string;
  structuredData?: Record<string, any>[];
}

export function generateMetadata({
  title,
  description = SITE_CONFIG.description,
  keywords = SITE_CONFIG.keywords,
  ogImage = SITE_CONFIG.ogImage,
  ogType = 'website',
  noIndex = false,
  canonical,
  structuredData = []
}: SEOParams = {}): Metadata {
  const pageTitle = title 
    ? `${title} | ${SITE_CONFIG.name}`
    : SITE_CONFIG.title;

  const ogImageUrl = ogImage.startsWith('http') 
    ? ogImage 
    : `${SITE_CONFIG.url}${ogImage}`;

  const canonicalUrl = canonical 
    ? (canonical.startsWith('http') ? canonical : `${SITE_CONFIG.url}${canonical}`)
    : undefined;

  return {
    title: pageTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.name,
    robots: noIndex 
      ? { index: false, follow: false }
      : { index: true, follow: true },
    ...(canonicalUrl && { 
      alternates: { 
        canonical: canonicalUrl 
      } 
    }),
    openGraph: {
      type: ogType,
      title: pageTitle,
      description,
      url: canonicalUrl || SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
    other: {
      // Custom structured data will be handled by JsonLd component
      ...structuredData.reduce((acc, schema, index) => {
        acc[`structuredData${index}`] = JSON.stringify(schema);
        return acc;
      }, {} as Record<string, string>)
    }
  };
}

// Specific page metadata generators
export const pageMetadata = {
  dashboard: () => generateMetadata({
    title: 'Dashboard',
    description: 'Access your tender responses, research sessions, and project overview in the CareDraft dashboard.',
    ogType: 'website'
  }),

  draftBuilder: (proposalTitle?: string) => generateMetadata({
    title: proposalTitle ? `Editing: ${proposalTitle}` : 'Draft Builder',
    description: 'AI-powered rich text editor for creating and editing tender proposals with intelligent assistance.',
    keywords: [...SITE_CONFIG.keywords, 'draft builder', 'text editor', 'proposal writing'],
    ogType: 'article'
  }),

  knowledgeHub: () => generateMetadata({
    title: 'Knowledge Hub',
    description: 'Browse and manage your organization\'s knowledge base for tender responses and research.',
    keywords: [...SITE_CONFIG.keywords, 'knowledge base', 'document library', 'research'],
    ogType: 'website'
  }),

  researchSessions: (sessionTitle?: string) => generateMetadata({
    title: sessionTitle ? `Research: ${sessionTitle}` : 'Research Sessions',
    description: 'AI-powered research sessions for gathering insights and information for tender responses.',
    keywords: [...SITE_CONFIG.keywords, 'research', 'AI research', 'tender research'],
    ogType: sessionTitle ? 'article' : 'website'
  }),

  brainstorm: () => generateMetadata({
    title: 'Brainstorm',
    description: 'Collaborative brainstorming tools for developing winning tender strategies and responses.',
    keywords: [...SITE_CONFIG.keywords, 'brainstorming', 'collaboration', 'strategy'],
    ogType: 'website'
  }),

  extract: () => generateMetadata({
    title: 'Document Extract',
    description: 'Extract and analyze key information from tender documents using AI-powered analysis tools.',
    keywords: [...SITE_CONFIG.keywords, 'document analysis', 'extraction', 'AI analysis'],
    ogType: 'website'
  }),

  answerBank: () => generateMetadata({
    title: 'Answer Bank',
    description: 'Manage your library of pre-written answers and responses for common tender questions.',
    keywords: [...SITE_CONFIG.keywords, 'answer bank', 'response library', 'templates'],
    ogType: 'website'
  }),

  tenderDetails: (tenderTitle?: string) => generateMetadata({
    title: tenderTitle ? `Tender: ${tenderTitle}` : 'Tender Details',
    description: 'View and manage tender opportunities with detailed analysis and response tracking.',
    keywords: [...SITE_CONFIG.keywords, 'tender details', 'opportunities', 'tracking'],
    ogType: 'article'
  }),

  compliance: () => generateMetadata({
    title: 'Compliance Check',
    description: 'Ensure your tender responses meet all requirements with automated compliance checking.',
    keywords: [...SITE_CONFIG.keywords, 'compliance', 'requirements', 'validation'],
    ogType: 'website'
  }),

  userManagement: () => generateMetadata({
    title: 'User Management',
    description: 'Manage team members, roles, and permissions for your CareDraft organization.',
    keywords: [...SITE_CONFIG.keywords, 'user management', 'team', 'permissions'],
    noIndex: true // Admin pages shouldn't be indexed
  }),

  notifications: () => generateMetadata({
    title: 'Notifications',
    description: 'Manage your notification preferences and view system alerts.',
    keywords: [...SITE_CONFIG.keywords, 'notifications', 'alerts', 'preferences'],
    noIndex: true // User-specific pages shouldn't be indexed
  }),

  settings: () => generateMetadata({
    title: 'Settings',
    description: 'Configure your CareDraft account and organization settings.',
    keywords: [...SITE_CONFIG.keywords, 'settings', 'configuration', 'preferences'],
    noIndex: true // User-specific pages shouldn't be indexed
  }),

  auth: {
    login: () => generateMetadata({
      title: 'Sign In',
      description: 'Sign in to your CareDraft account to access tender response tools and research capabilities.',
      keywords: [...SITE_CONFIG.keywords, 'login', 'sign in', 'authentication']
    }),

    signup: () => generateMetadata({
      title: 'Sign Up',
      description: 'Create your CareDraft account and start streamlining your tender response process today.',
      keywords: [...SITE_CONFIG.keywords, 'signup', 'register', 'create account']
    }),

    resetPassword: () => generateMetadata({
      title: 'Reset Password',
      description: 'Reset your CareDraft account password to regain access to your tender response tools.',
      noIndex: true
    })
  }
};

// Breadcrumb structured data generator
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${SITE_CONFIG.url}${crumb.url}`
    }))
  };
}

// Article structured data for research sessions and proposals
export function generateArticleSchema({
  title,
  description,
  author = SITE_CONFIG.author,
  datePublished,
  dateModified,
  url,
  imageUrl
}: {
  title: string;
  description: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  imageUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/images/logo.png`
      }
    },
    datePublished,
    dateModified: dateModified || datePublished,
    url: url.startsWith('http') ? url : `${SITE_CONFIG.url}${url}`,
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl.startsWith('http') ? imageUrl : `${SITE_CONFIG.url}${imageUrl}`,
        width: 1200,
        height: 630
      }
    })
  };
}

// FAQ structured data for help pages
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

// Website structured data for main pages
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
} 