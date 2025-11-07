module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/articles',
        'http://localhost:3000/blog',
        'http://localhost:3000/wiki',
        'http://localhost:3000/gallery',
        'http://localhost:3000/login',
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],

        // Resource optimization
        'uses-optimized-images': 'warn',
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-webp-images': 'warn',

        // JavaScript optimization
        'unused-javascript': 'warn',
        'unminified-javascript': 'error',
        'legacy-javascript': 'warn',
        'uses-text-compression': 'error',

        // CSS optimization
        'unused-css-rules': 'warn',
        'unminified-css': 'error',

        // Render optimization
        'render-blocking-resources': 'warn',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',

        // Best practices
        'uses-http2': 'warn',
        'uses-passive-event-listeners': 'warn',
        'no-document-write': 'error',
        'uses-long-cache-ttl': 'warn',

        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'meta-viewport': 'error',

        // SEO
        'meta-description': 'warn',
        'document-title': 'error',
        'link-text': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
