# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Multimedia Portal frontend to achieve Lighthouse scores > 90 and optimal Core Web Vitals.

## Table of Contents

1. [Overview](#overview)
2. [Core Web Vitals](#core-web-vitals)
3. [Optimization Strategies](#optimization-strategies)
4. [Lighthouse Auditing](#lighthouse-auditing)
5. [Performance Monitoring](#performance-monitoring)
6. [Best Practices](#best-practices)

## Overview

### Performance Goals

- **Lighthouse Score**: > 90 for all categories
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 800ms

### Current Optimizations

✅ Bundle size optimization and code splitting
✅ Image optimization with Next.js Image component
✅ Font loading optimization
✅ Resource hints (preconnect, prefetch, preload)
✅ Webpack/Turbopack optimizations
✅ HTTP caching headers
✅ Compression enabled
✅ Web Vitals tracking

## Core Web Vitals

### 1. Largest Contentful Paint (LCP)

**Target**: < 2.5 seconds

**Optimizations**:
- Image optimization with AVIF/WebP formats
- Lazy loading for below-the-fold images
- Preload critical resources (fonts, hero images)
- CDN usage for static assets
- Server-side rendering for critical content

**Monitoring**:
```typescript
import { onLCP } from 'web-vitals';

onLCP(console.log);
```

### 2. First Input Delay (FID) / Interaction to Next Paint (INP)

**Target**: FID < 100ms, INP < 200ms

**Optimizations**:
- Code splitting to reduce main thread blocking
- Defer non-critical JavaScript
- Use web workers for heavy computations
- Optimize event handlers
- Remove unused JavaScript

### 3. Cumulative Layout Shift (CLS)

**Target**: < 0.1

**Optimizations**:
- Set explicit width/height for images
- Reserve space for ads and embeds
- Use CSS aspect-ratio for responsive media
- Preload fonts with font-display: swap
- Avoid inserting content above existing content

**Example**:
```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={1200}
  height={630}
  alt="Hero"
  priority // Preload LCP image
/>
```

## Optimization Strategies

### 1. Bundle Optimization

**Code Splitting**:
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR if not needed
});
```

**Bundle Analysis**:
```bash
npm run analyze
```

**Optimizations**:
- Separate vendor chunks (React, libraries)
- Route-based code splitting (automatic in Next.js)
- Tree shaking for unused code
- Minification in production

### 2. Image Optimization

**Next.js Image Component**:
```tsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  width={800}
  height={600}
  alt="Description"
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL="data:image/..." // Generate with plaiceholder
/>
```

**Features**:
- Automatic format detection (AVIF, WebP)
- Responsive images with srcset
- Lazy loading by default
- Blur placeholder during load
- Optimized image sizes

### 3. Font Optimization

**Using next/font**:
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents FOIT
  preload: true,
  variable: '--font-inter',
});
```

**Benefits**:
- Self-hosted fonts (no external requests)
- Automatic subsetting
- Font preloading
- Optimized font-face CSS
- Zero layout shift

### 4. Resource Hints

**Preconnect to APIs**:
```tsx
// In app/layout.tsx
<link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
<link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
```

**Preload Critical Resources**:
```tsx
<link
  rel="preload"
  href="/fonts/custom.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

**Prefetch Next Pages**:
```tsx
import { useRouter } from 'next/router';

// Prefetch likely next page
router.prefetch('/articles');
```

### 5. Caching Strategy

**Static Assets** (fonts, images, scripts):
```
Cache-Control: public, max-age=31536000, immutable
```

**API Responses**:
```typescript
// Revalidate every 60 seconds
export const revalidate = 60;
```

**Client-side Caching**:
```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

## Lighthouse Auditing

### Running Lighthouse

**Local Audit**:
```bash
npm run lighthouse
```

**CI/CD Integration**:
```bash
npm run lighthouse:ci
```

**Manual Audit**:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select categories
4. Run audit

### Interpreting Results

**Performance Score Breakdown**:
- First Contentful Paint (10%)
- Speed Index (10%)
- Largest Contentful Paint (25%)
- Time to Interactive (10%)
- Total Blocking Time (30%)
- Cumulative Layout Shift (15%)

**Thresholds**:
- **90-100**: Good (Green)
- **50-89**: Needs Improvement (Orange)
- **0-49**: Poor (Red)

### Common Issues and Fixes

**1. Render-blocking Resources**

Problem: CSS/JS blocks first paint

Fix:
```tsx
// Inline critical CSS
<style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

// Defer non-critical scripts
<Script src="/analytics.js" strategy="lazyOnload" />
```

**2. Unused JavaScript**

Problem: Large bundle with unused code

Fix:
- Use dynamic imports
- Remove unused dependencies
- Enable tree shaking
- Use package imports optimization

**3. Large Images**

Problem: Unoptimized images slow LCP

Fix:
- Use Next.js Image component
- Enable AVIF/WebP formats
- Implement responsive images
- Lazy load below-the-fold images

**4. Third-party Scripts**

Problem: External scripts block main thread

Fix:
```tsx
import Script from 'next/script';

<Script
  src="https://external-script.com/script.js"
  strategy="lazyOnload" // or "afterInteractive"
/>
```

## Performance Monitoring

### Web Vitals Tracking

**Setup** (in app/layout.tsx):
```typescript
'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance/web-vitals';

export default function RootLayout({ children }) {
  useEffect(() => {
    initWebVitals();
  }, []);

  return <html>{children}</html>;
}
```

**Custom Analytics Integration**:
```typescript
// lib/performance/web-vitals.ts
function sendToAnalytics(metric) {
  // Send to your analytics service
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}
```

### Performance API

**Navigation Timing**:
```typescript
import { getNavigationTiming } from '@/lib/performance/web-vitals';

const timing = getNavigationTiming();
console.log('DNS:', timing.dns, 'ms');
console.log('TCP:', timing.tcp, 'ms');
console.log('Request:', timing.request, 'ms');
```

**Resource Timing**:
```typescript
import { getResourceTimingSummary } from '@/lib/performance/web-vitals';

const resources = getResourceTimingSummary();
console.log('Total resources:', resources.total);
console.log('By type:', resources.byType);
```

## Best Practices

### Development

1. **Always use Next.js Image component** for images
2. **Use dynamic imports** for heavy components
3. **Implement proper loading states** to prevent CLS
4. **Set explicit dimensions** for images and embeds
5. **Prefer CSS-in-JS with zero runtime** (e.g., Tailwind)
6. **Use React.memo()** for expensive components
7. **Implement virtualization** for long lists

### Production

1. **Enable compression** (gzip/brotli)
2. **Use CDN** for static assets
3. **Implement caching strategy**
4. **Monitor Web Vitals** in production
5. **Set up performance budgets**
6. **Regular Lighthouse audits**
7. **A/B test performance improvements**

### Code Review Checklist

- [ ] Images use Next.js Image component
- [ ] Heavy components use dynamic imports
- [ ] Loading states prevent layout shifts
- [ ] No render-blocking resources
- [ ] Fonts use next/font or are optimized
- [ ] API calls are cached appropriately
- [ ] Bundle size is within budget
- [ ] Lighthouse score > 90

## Tools and Resources

### Lighthouse Reports

Reports are saved to `lighthouse-reports/` directory:
- `lighthouse-reports/{page-name}.html` - Visual report
- `lighthouse-reports/{page-name}.json` - Raw data
- `lighthouse-reports/summary.json` - All pages summary

### Bundle Analysis

```bash
npm run analyze
```

Opens bundle analyzer in browser showing:
- Bundle composition
- Chunk sizes
- Module sizes
- Duplicate dependencies

### Performance APIs

- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)

## Troubleshooting

### Slow Build Times

1. Check for large dependencies
2. Review webpack/turbopack config
3. Consider incremental builds
4. Use SWC instead of Babel

### Poor Lighthouse Scores

1. Run audit in incognito mode
2. Disable browser extensions
3. Use production build
4. Check network conditions
5. Review Core Web Vitals individually

### Layout Shifts

1. Set width/height on images
2. Reserve space for dynamic content
3. Use aspect-ratio CSS
4. Preload fonts
5. Check for content injection

## Continuous Improvement

1. **Weekly Lighthouse audits** on staging
2. **Monitor Web Vitals** in production
3. **Track performance budgets** in CI/CD
4. **Review bundle size** on each release
5. **Stay updated** with Next.js optimizations
6. **Test on real devices** and networks

## Contact

For performance-related questions or issues, please contact the development team or create an issue in the repository.
