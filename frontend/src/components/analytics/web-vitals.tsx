'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals Component
 * Tracks Core Web Vitals and sends them to analytics
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
    }

    // Send to analytics endpoint
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });

    // Send to your analytics endpoint
    if (typeof window !== 'undefined') {
      // Use sendBeacon if available, fallback to fetch
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/web-vitals', body);
      } else {
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(console.error);
      }
    }

    // Also send to console for monitoring
    switch (metric.name) {
      case 'FCP': // First Contentful Paint
        console.info(`FCP: ${metric.value}ms (${metric.rating})`);
        break;
      case 'LCP': // Largest Contentful Paint
        console.info(`LCP: ${metric.value}ms (${metric.rating})`);
        break;
      case 'CLS': // Cumulative Layout Shift
        console.info(`CLS: ${metric.value} (${metric.rating})`);
        break;
      case 'FID': // First Input Delay
        console.info(`FID: ${metric.value}ms (${metric.rating})`);
        break;
      case 'TTFB': // Time to First Byte
        console.info(`TTFB: ${metric.value}ms (${metric.rating})`);
        break;
      case 'INP': // Interaction to Next Paint
        console.info(`INP: ${metric.value}ms (${metric.rating})`);
        break;
    }
  });

  return null;
}

/**
 * Helper function to manually measure custom metrics
 */
export function measurePerformance(metricName: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.mark(endMark);
      performance.measure(metricName, startMark, endMark);

      const measure = performance.getEntriesByName(metricName)[0];
      if (measure) {
        console.info(`${metricName}: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      }
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }
  return null;
}
