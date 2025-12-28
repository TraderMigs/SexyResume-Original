import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateSEOTags, SEOProps } from '../lib/seo';

interface SEOHeadProps extends SEOProps {
  children?: React.ReactNode;
}

export default function SEOHead(props: SEOHeadProps) {
  const seoTags = generateSEOTags(props);

  return (
    <Helmet>
      <title>{seoTags.title}</title>
      
      {seoTags.meta.map((meta, index) => (
        <meta key={index} {...meta} />
      ))}
      
      {seoTags.link.map((link, index) => (
        <link key={index} {...link} />
      ))}
      
      {seoTags.script.map((script, index) => (
        <script key={index} {...script} />
      ))}
      
      {props.children}
    </Helmet>
  );
}