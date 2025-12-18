import React from 'react';
import { Helmet } from 'react-helmet-async';
import APP_CONFIG from '../config/app';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = 'The complete platform for managing music careers. Manage artists, plan releases, track performance, and grow careers.',
  keywords = ['music management', 'artist management', 'music career', 'music platform', 'artist manager'],
  image = `${APP_CONFIG.url}/og-image.png`,
  url = APP_CONFIG.url,
  type = 'website',
  author = APP_CONFIG.company.name,
  publishedTime,
  modifiedTime
}) => {
  const fullTitle = title ? `${title} | ${APP_CONFIG.name}` : `${APP_CONFIG.name} - The Operating System for Music Careers`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={APP_CONFIG.name} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@taskmaster" />
      
      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: APP_CONFIG.name,
          description: description,
          url: APP_CONFIG.url,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '28',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '150'
          },
          author: {
            '@type': 'Organization',
            name: APP_CONFIG.company.name,
            url: APP_CONFIG.url
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
