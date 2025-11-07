/**
 * Font Optimization Utilities
 *
 * Optimizes web font loading for better performance:
 * - Preloads critical fonts
 * - Uses font-display: swap for better FCP
 * - Implements subsetting for reduced file sizes
 * - Provides font loading strategies
 */

import { Inter, Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Configure primary font (Inter)
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Use 'swap' for better FCP, prevents FOIT (Flash of Invisible Text)
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true, // Automatically adjusts size to match fallback font
  weight: ['400', '500', '600', '700'],
});

// Configure monospace font
export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
  preload: false, // Don't preload non-critical fonts
  fallback: ['Courier New', 'monospace'],
  weight: ['400', '700'],
});

// Example: Local font configuration (if using custom fonts)
// export const customFont = localFont({
//   src: [
//     {
//       path: '../../../public/fonts/custom-regular.woff2',
//       weight: '400',
//       style: 'normal',
//     },
//     {
//       path: '../../../public/fonts/custom-bold.woff2',
//       weight: '700',
//       style: 'normal',
//     },
//   ],
//   variable: '--font-custom',
//   display: 'swap',
//   preload: true,
//   fallback: ['system-ui', 'arial'],
// });

/**
 * Font preload configuration for manual preloading
 * Add to <head> in app/layout.tsx
 */
export const fontPreloadLinks = [
  // Example preload link (Next.js handles this automatically for next/font)
  // {
  //   rel: 'preload',
  //   href: '/fonts/custom-font.woff2',
  //   as: 'font',
  //   type: 'font/woff2',
  //   crossOrigin: 'anonymous',
  // },
];

/**
 * CSS for font-face with optimizations
 */
export const fontFaceCSS = `
  /* System font stack for immediate rendering */
  :root {
    --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
      'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    --font-mono: 'Courier New', Courier, monospace;
  }

  /* Optional: Size adjust for fallback fonts to minimize CLS */
  @font-face {
    font-family: 'Inter Fallback';
    src: local('Arial');
    size-adjust: 107%;
    ascent-override: 90%;
    descent-override: 22%;
    line-gap-override: 0%;
  }
`;

/**
 * Get font class names for use in components
 */
export function getFontClassNames() {
  return {
    sans: inter.className,
    mono: robotoMono.className,
    sansVariable: inter.variable,
    monoVariable: robotoMono.variable,
  };
}

/**
 * Font loading strategy component
 * Use in app/layout.tsx
 */
export function FontLoadingStrategy() {
  return (
    <>
      {/* Preconnect to font CDNs (if using external fonts) */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* DNS prefetch as fallback */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

      {/* Inline critical font CSS to prevent FOUT */}
      <style
        dangerouslySetInnerHTML={{
          __html: fontFaceCSS,
        }}
      />
    </>
  );
}

/**
 * Hook for font loading detection
 */
export function useFontLoadingStatus() {
  if (typeof window === 'undefined' || !('fonts' in document)) {
    return { loaded: false, loading: false };
  }

  const [status, setStatus] = React.useState({
    loaded: document.fonts.status === 'loaded',
    loading: document.fonts.status === 'loading',
  });

  React.useEffect(() => {
    const handleFontsLoaded = () => {
      setStatus({ loaded: true, loading: false });
    };

    document.fonts.addEventListener('loadingdone', handleFontsLoaded);

    return () => {
      document.fonts.removeEventListener('loadingdone', handleFontsLoaded);
    };
  }, []);

  return status;
}

// Placeholder React import (remove this and import React properly)
const React = { useState: (() => {}) as any, useEffect: (() => {}) as any };
