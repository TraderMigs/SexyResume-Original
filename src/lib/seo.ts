import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  structuredData?: Record<string, any>;
  noIndex?: boolean;
}

export const DEFAULT_SEO: SEOProps = {
  title: 'SexyResume.com - AI-Powered Professional Resume Builder',
  description: 'Create stunning, ATS-optimized resumes with AI-powered parsing, professional templates, and secure exports. Build your perfect resume in minutes.',
  keywords: [
    'resume builder',
    'AI resume',
    'professional resume',
    'ATS optimized',
    'cover letter generator',
    'job application',
    'career tools',
    'resume templates',
    'PDF resume',
    'resume export'
  ],
  ogImage: '/og-image.jpg',
  ogType: 'website'
};

export function generateSEOTags(props: SEOProps = {}) {
  const seo = { ...DEFAULT_SEO, ...props };
  
  return {
    title: seo.title,
    meta: [
      { name: 'description', content: seo.description },
      { name: 'keywords', content: seo.keywords?.join(', ') },
      { name: 'robots', content: seo.noIndex ? 'noindex,nofollow' : 'index,follow' },
      
      // Open Graph
      { property: 'og:title', content: seo.title },
      { property: 'og:description', content: seo.description },
      { property: 'og:type', content: seo.ogType },
      { property: 'og:image', content: seo.ogImage },
      { property: 'og:site_name', content: 'SexyResume.com' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seo.title },
      { name: 'twitter:description', content: seo.description },
      { name: 'twitter:image', content: seo.ogImage },
      
      // Additional SEO
      { name: 'author', content: 'SexyResume.com' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'theme-color', content: '#d946ef' },
    ],
    link: [
      ...(seo.canonical ? [{ rel: 'canonical', href: seo.canonical }] : []),
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
    script: seo.structuredData ? [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(seo.structuredData)
      }
    ] : []
  };
}

// Structured data generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SexyResume.com',
    description: 'AI-powered professional resume builder with secure exports and cover letter generation',
    url: 'https://sexyresume.com',
    logo: 'https://sexyresume.com/logo.png',
    sameAs: [
      'https://twitter.com/sexyresume',
      'https://linkedin.com/company/sexyresume'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@sexyresume.com'
    }
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SexyResume.com',
    description: 'Professional resume builder with AI-powered parsing and multiple export formats',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '7.00',
      priceCurrency: 'USD',
      description: 'One-time payment for unlimited resume and cover letter exports'
    },
    featureList: [
      'AI-powered resume parsing',
      'Professional templates',
      'PDF, Word, and ATS exports',
      'Cover letter generation',
      'Secure data handling'
    ],
    screenshot: 'https://sexyresume.com/screenshot.jpg'
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// SEO page configurations
export const SEO_PAGES = {
  home: {
    title: 'SexyResume.com - AI Resume Builder | Professional Templates & Exports',
    description: 'Create stunning, ATS-optimized resumes with AI parsing, professional templates, and secure exports. Build your perfect resume in minutes with our intelligent resume builder.',
    keywords: ['resume builder', 'AI resume', 'professional resume', 'ATS optimized', 'resume templates'],
    structuredData: generateSoftwareApplicationSchema()
  },
  
  templates: {
    title: 'Professional Resume Templates | SexyResume.com',
    description: 'Choose from 5 professionally designed resume templates. Modern, Classic, Creative, Minimal, and Executive styles with full customization options.',
    keywords: ['resume templates', 'professional templates', 'modern resume', 'classic resume', 'creative resume'],
  },
  
  export: {
    title: 'Export Resume - PDF, Word, ATS Format | SexyResume.com',
    description: 'Export your resume in multiple formats: PDF, Word, plain text, and ATS-optimized. Professional quality with secure downloads.',
    keywords: ['resume export', 'PDF resume', 'Word resume', 'ATS resume', 'resume download'],
  },
  
  coverLetter: {
    title: 'AI Cover Letter Generator | SexyResume.com',
    description: 'Generate personalized cover letters with AI. Match your resume template, customize tone and length, and export professionally formatted letters.',
    keywords: ['cover letter generator', 'AI cover letter', 'personalized cover letter', 'job application'],
  }
};