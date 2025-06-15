import React from 'react'

interface OGImageProps {
  title?: string
  subtitle?: string
  description?: string
  type?: 'default' | 'proposal' | 'dashboard' | 'auth'
}

export function OGImageTemplate({ 
  title = 'CareDraft',
  subtitle = 'AI-Powered Care Proposal Platform',
  description = 'Create winning care proposals with AI-powered assistance.',
  type = 'default'
}: OGImageProps) {
  const getBackgroundGradient = () => {
    switch (type) {
      case 'proposal':
        return 'linear-gradient(135deg, #F0F9F9 0%, #E8F5F5 50%, #D1F2F2 100%)'
      case 'dashboard':
        return 'linear-gradient(135deg, #E8F5F5 0%, #F0F9F9 50%, #F7FDFD 100%)'
      case 'auth':
        return 'linear-gradient(135deg, #F7FDFD 0%, #E8F5F5 50%, #F0F9F9 100%)'
      default:
        return 'linear-gradient(135deg, #F0F9F9 0%, #E8F5F5 100%)'
    }
  }

  const styles = {
    container: {
      width: '1200px',
      height: '630px',
      background: getBackgroundGradient(),
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      margin: 0,
      padding: 0,
    },
    content: {
      textAlign: 'center' as const,
      zIndex: 2,
      maxWidth: '800px',
      padding: '0 40px',
    },
    icon: {
      width: '120px',
      height: '120px',
      background: '#2A6F6F',
      borderRadius: '16px',
      margin: '0 auto 24px',
      position: 'relative' as const,
      boxShadow: '0 20px 40px rgba(42, 111, 111, 0.2)',
    },
    iconCorner: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      width: '24px',
      height: '24px',
      background: '#1F4F4F',
      clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
    },
    iconLines: {
      position: 'absolute' as const,
      top: '24px',
      left: '20px',
      right: '20px',
    },
    line: {
      height: '4px',
      background: '#E8F5F5',
      borderRadius: '2px',
      marginBottom: '8px',
    },
    sparkle: {
      position: 'absolute' as const,
      bottom: '20px',
      right: '20px',
      width: '20px',
      height: '20px',
      background: '#F0F9F9',
      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    },
    title: {
      fontSize: '64px',
      fontWeight: 700,
      color: '#2A6F6F',
      margin: '0 0 16px',
      letterSpacing: '-1px',
      lineHeight: 1.1,
    },
    subtitle: {
      fontSize: '28px',
      color: '#1F4F4F',
      margin: '0 0 24px',
      fontWeight: 400,
    },
    description: {
      fontSize: '20px',
      color: '#4A5568',
      margin: 0,
      lineHeight: 1.4,
    },
    pattern: {
      position: 'absolute' as const,
      top: '-50px',
      right: '-50px',
      width: '300px',
      height: '300px',
      border: '2px solid rgba(42, 111, 111, 0.1)',
      borderRadius: '50%',
      zIndex: 1,
    },
    patternInner: {
      position: 'absolute' as const,
      top: '50px',
      left: '50px',
      width: '200px',
      height: '200px',
      border: '2px solid rgba(42, 111, 111, 0.05)',
      borderRadius: '50%',
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.pattern}>
        <div style={styles.patternInner}></div>
      </div>
      <div style={styles.content}>
        <div style={styles.icon}>
          <div style={styles.iconCorner}></div>
          <div style={styles.iconLines}>
            <div style={{...styles.line, width: '100%'}}></div>
            <div style={{...styles.line, width: '75%'}}></div>
            <div style={{...styles.line, width: '90%'}}></div>
            <div style={{...styles.line, width: '60%'}}></div>
          </div>
          <div style={styles.sparkle}></div>
        </div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
        <p style={styles.description}>{description}</p>
      </div>
    </div>
  )
}

// Utility to generate meta tags for specific pages
export function getOGMetadata(options: OGImageProps & { url?: string }) {
  return {
    title: options.title || 'CareDraft - AI-Powered Care Proposal Platform',
    description: options.description || 'Create winning care proposals with AI-powered assistance.',
    openGraph: {
      title: options.title || 'CareDraft - AI-Powered Care Proposal Platform',
      description: options.description || 'Create winning care proposals with AI-powered assistance.',
      url: options.url || '/',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: options.title || 'CareDraft - AI-Powered Care Proposal Platform',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: options.title || 'CareDraft - AI-Powered Care Proposal Platform',
      description: options.description || 'Create winning care proposals with AI-powered assistance.',
      images: ['/og-image.png'],
    }
  }
} 