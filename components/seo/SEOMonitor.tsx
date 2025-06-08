'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SEOCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  value?: string;
}

interface SEOAnalysis {
  title: SEOCheck;
  description: SEOCheck;
  keywords: SEOCheck;
  openGraph: SEOCheck[];
  twitter: SEOCheck[];
  structuredData: SEOCheck[];
  technical: SEOCheck[];
}

export function SEOMonitor() {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      analyzePage();
    }
  }, []);

  const analyzePage = () => {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    
    // Open Graph checks
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content') || '';
    
    // Twitter Card checks
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '';
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '';
    const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';
    
    // Structured data checks
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const structuredDataCount = jsonLdScripts.length;
    
    const newAnalysis: SEOAnalysis = {
      title: {
        name: 'Page Title',
        status: title.length > 0 && title.length <= 60 ? 'pass' : title.length > 60 ? 'warning' : 'fail',
        message: title.length === 0 ? 'Missing page title' : 
                title.length > 60 ? `Title too long (${title.length} chars, recommended: ≤60)` : 
                `Good title length (${title.length} chars)`,
        value: title
      },
      description: {
        name: 'Meta Description',
        status: metaDescription.length > 0 && metaDescription.length <= 160 ? 'pass' : 
                metaDescription.length > 160 ? 'warning' : 'fail',
        message: metaDescription.length === 0 ? 'Missing meta description' :
                metaDescription.length > 160 ? `Description too long (${metaDescription.length} chars, recommended: ≤160)` :
                `Good description length (${metaDescription.length} chars)`,
        value: metaDescription
      },
      keywords: {
        name: 'Meta Keywords',
        status: metaKeywords.length > 0 ? 'pass' : 'warning',
        message: metaKeywords.length === 0 ? 'No meta keywords (optional but helpful)' : 'Meta keywords present',
        value: metaKeywords
      },
      openGraph: [
        {
          name: 'OG Title',
          status: ogTitle.length > 0 ? 'pass' : 'fail',
          message: ogTitle.length === 0 ? 'Missing Open Graph title' : 'Open Graph title present',
          value: ogTitle
        },
        {
          name: 'OG Description',
          status: ogDescription.length > 0 ? 'pass' : 'fail',
          message: ogDescription.length === 0 ? 'Missing Open Graph description' : 'Open Graph description present',
          value: ogDescription
        },
        {
          name: 'OG Image',
          status: ogImage.length > 0 ? 'pass' : 'warning',
          message: ogImage.length === 0 ? 'Missing Open Graph image' : 'Open Graph image present',
          value: ogImage
        },
        {
          name: 'OG Type',
          status: ogType.length > 0 ? 'pass' : 'warning',
          message: ogType.length === 0 ? 'Missing Open Graph type' : 'Open Graph type present',
          value: ogType
        }
      ],
      twitter: [
        {
          name: 'Twitter Card',
          status: twitterCard.length > 0 ? 'pass' : 'warning',
          message: twitterCard.length === 0 ? 'Missing Twitter Card type' : 'Twitter Card type present',
          value: twitterCard
        },
        {
          name: 'Twitter Title',
          status: twitterTitle.length > 0 ? 'pass' : 'warning',
          message: twitterTitle.length === 0 ? 'Missing Twitter title' : 'Twitter title present',
          value: twitterTitle
        },
        {
          name: 'Twitter Description',
          status: twitterDescription.length > 0 ? 'pass' : 'warning',
          message: twitterDescription.length === 0 ? 'Missing Twitter description' : 'Twitter description present',
          value: twitterDescription
        },
        {
          name: 'Twitter Image',
          status: twitterImage.length > 0 ? 'pass' : 'warning',
          message: twitterImage.length === 0 ? 'Missing Twitter image' : 'Twitter image present',
          value: twitterImage
        }
      ],
      structuredData: [
        {
          name: 'JSON-LD Scripts',
          status: structuredDataCount > 0 ? 'pass' : 'warning',
          message: structuredDataCount === 0 ? 'No structured data found' : 
                  `${structuredDataCount} structured data script(s) found`,
          value: structuredDataCount.toString()
        }
      ],
      technical: [
        {
          name: 'Canonical URL',
          status: canonicalUrl.length > 0 ? 'pass' : 'warning',
          message: canonicalUrl.length === 0 ? 'No canonical URL set' : 'Canonical URL present',
          value: canonicalUrl
        },
        {
          name: 'Viewport Meta',
          status: document.querySelector('meta[name="viewport"]') ? 'pass' : 'fail',
          message: document.querySelector('meta[name="viewport"]') ? 'Viewport meta tag present' : 'Missing viewport meta tag',
          value: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
        },
        {
          name: 'Language',
          status: document.documentElement.lang ? 'pass' : 'warning',
          message: document.documentElement.lang ? 'HTML lang attribute present' : 'Missing HTML lang attribute',
          value: document.documentElement.lang
        }
      ]
    };

    setAnalysis(newAnalysis);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const variants = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const renderChecks = (checks: SEOCheck[]) => (
    <div className="space-y-3">
      {checks.map((check, index) => (
        <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
          <div className="flex items-start space-x-2">
            {getStatusIcon(check.status)}
            <div>
              <h4 className="font-medium text-sm">{check.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{check.message}</p>
              {check.value && (
                <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded">
                  {check.value.length > 100 ? `${check.value.substring(0, 100)}...` : check.value}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge(check.status)}
        </div>
      ))}
    </div>
  );

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        SEO Check
      </Button>
    );
  }

  if (!analysis) {
    return null;
  }

  const totalChecks = [
    analysis.title,
    analysis.description,
    analysis.keywords,
    ...analysis.openGraph,
    ...analysis.twitter,
    ...analysis.structuredData,
    ...analysis.technical
  ];

  const passedChecks = totalChecks.filter(check => check.status === 'pass').length;
  const failedChecks = totalChecks.filter(check => check.status === 'fail').length;
  const warningChecks = totalChecks.filter(check => check.status === 'warning').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">SEO Analysis</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              ×
            </Button>
          </div>
          <div className="flex space-x-2 text-sm">
            <span className="text-green-600">✓ {passedChecks}</span>
            <span className="text-yellow-600">⚠ {warningChecks}</span>
            <span className="text-red-600">✗ {failedChecks}</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-96">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="tech">Tech</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              {renderChecks([analysis.title, analysis.description, analysis.keywords])}
            </TabsContent>
            
            <TabsContent value="social" className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Open Graph</h3>
                {renderChecks(analysis.openGraph)}
              </div>
              <div>
                <h3 className="font-medium mb-2">Twitter Cards</h3>
                {renderChecks(analysis.twitter)}
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="space-y-4">
              {renderChecks(analysis.structuredData)}
            </TabsContent>
            
            <TabsContent value="tech" className="space-y-4">
              {renderChecks(analysis.technical)}
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 pt-3 border-t">
            <Button
              onClick={analyzePage}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Refresh Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 