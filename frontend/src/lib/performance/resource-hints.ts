/**
 * Resource Hints Optimization
 *
 * Implements resource hints for better performance:
 * - dns-prefetch: Resolve DNS early
 * - preconnect: Establish connections early
 * - prefetch: Fetch resources for next navigation
 * - preload: Load critical resources early
 */

export interface ResourceHint {
  rel: 'dns-prefetch' | 'preconnect' | 'prefetch' | 'preload' | 'modulepreload';
  href: string;
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
}

/**
 * API endpoints to preconnect
 */
export const API_ENDPOINTS: ResourceHint[] = [
  {
    rel: 'preconnect',
    href: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  {
    rel: 'dns-prefetch',
    href: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
];

/**
 * CDN and external resources
 */
export const EXTERNAL_RESOURCES: ResourceHint[] = [
  // Google Fonts
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://fonts.googleapis.com',
  },

  // Add other external resources here
  // Example: Analytics, CDNs, etc.
];

/**
 * Critical fonts to preload
 */
export const CRITICAL_FONTS: ResourceHint[] = [
  // Next.js handles font preloading automatically for next/font
  // Add custom fonts here if needed
];

/**
 * Critical images to preload (LCP candidates)
 */
export const CRITICAL_IMAGES: ResourceHint[] = [
  // Example: Hero images, logos
  // {
  //   rel: 'preload',
  //   href: '/images/hero.webp',
  //   as: 'image',
  //   type: 'image/webp',
  // },
];

/**
 * Critical scripts to preload
 */
export const CRITICAL_SCRIPTS: ResourceHint[] = [
  // Next.js handles script preloading
  // Add custom scripts if needed
];

/**
 * Resources to prefetch for next navigation
 */
export const PREFETCH_RESOURCES: ResourceHint[] = [
  // Example: Prefetch resources for likely next pages
  // {
  //   rel: 'prefetch',
  //   href: '/api/articles',
  //   as: 'fetch',
  // },
];

/**
 * Get all resource hints
 */
export function getAllResourceHints(): ResourceHint[] {
  return [
    ...API_ENDPOINTS,
    ...EXTERNAL_RESOURCES,
    ...CRITICAL_FONTS,
    ...CRITICAL_IMAGES,
    ...CRITICAL_SCRIPTS,
    ...PREFETCH_RESOURCES,
  ];
}

/**
 * Dynamically add resource hint to document
 */
export function addResourceHint(hint: ResourceHint): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = hint.rel;
  link.href = hint.href;

  if (hint.as) link.as = hint.as;
  if (hint.type) link.type = hint.type;
  if (hint.crossOrigin) link.crossOrigin = hint.crossOrigin;
  if (hint.media) link.media = hint.media;

  document.head.appendChild(link);
}

/**
 * Prefetch data for route
 */
export function prefetchRoute(route: string): void {
  if (typeof window === 'undefined') return;

  // Use Next.js router prefetch
  // @ts-ignore
  if (window.next && window.next.router) {
    // @ts-ignore
    window.next.router.prefetch(route);
  }
}

/**
 * Prefetch image
 */
export function prefetchImage(src: string): void {
  if (typeof window === 'undefined') return;

  const img = new Image();
  img.src = src;
}

/**
 * Prefetch data (fetch and cache)
 */
export async function prefetchData(url: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch(url, {
      priority: 'low',
    } as any);

    // Data is now in browser cache
    return;
  } catch (error) {
    console.warn('Failed to prefetch:', url, error);
  }
}

/**
 * Get recommended resource hints for a specific page
 */
export function getPageResourceHints(pageName: string): ResourceHint[] {
  const commonHints = [...API_ENDPOINTS, ...EXTERNAL_RESOURCES];

  switch (pageName) {
    case 'home':
      return [
        ...commonHints,
        ...CRITICAL_IMAGES,
        {
          rel: 'prefetch',
          href: '/articles',
          as: 'document',
        },
      ];

    case 'articles':
      return [
        ...commonHints,
        {
          rel: 'prefetch',
          href: '/api/articles',
          as: 'fetch',
        },
      ];

    case 'blog':
      return [
        ...commonHints,
        {
          rel: 'prefetch',
          href: '/api/blog',
          as: 'fetch',
        },
      ];

    case 'gallery':
      return [
        ...commonHints,
        {
          rel: 'prefetch',
          href: '/api/gallery',
          as: 'fetch',
        },
      ];

    default:
      return commonHints;
  }
}
