/**
 * _document.js - Phase 9
 * Custom Next.js document with PWA meta tags
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Primary Meta Tags */}
        <meta name="application-name" content="ECO FARM" />
        <meta name="description" content="ECO FARM - Advanced Poultry Analytics and Farm Management System with AI-powered insights" />
        <meta name="theme-color" content="#16a34a" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        
        {/* Apple Mobile Web App */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ECO FARM" />
        
        {/* Mobile Optimizations - Viewport handled by Next.js automatically */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/icons/icon-192.png" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ECO FARM - Poultry Analytics" />
        <meta property="og:description" content="Advanced farm management system with AI-powered analytics and insights" />
        <meta property="og:image" content="/icons/icon-512.png" />
        <meta property="og:site_name" content="ECO FARM" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ECO FARM - Poultry Analytics" />
        <meta name="twitter:description" content="Advanced farm management system with AI-powered analytics" />
        <meta name="twitter:image" content="/icons/icon-512.png" />
        
        {/* Preconnect to API */}
        <link rel="preconnect" href="http://localhost:8000" />
        <link rel="dns-prefetch" href="http://localhost:8000" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
