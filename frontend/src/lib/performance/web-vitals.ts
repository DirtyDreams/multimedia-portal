/**
 * Web Vitals Tracking and Reporting
 *
 * Monitors Core Web Vitals (CWV) metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay) / INP (Interaction to Next Paint)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 */

import { Metric, onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals';

// Metric thresholds (good/needs improvement/poor)
export const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

export type MetricName = keyof typeof THRESHOLDS;

export interface WebVitalsReport extends Metric {
  rating: 'good' | 'needs-improvement' | 'poor';
  attribution?: any;
}

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: MetricName,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: WebVitalsReport) {
  // Send to your analytics service
  // Example: Google Analytics, custom endpoint, etc.

  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
      id: metric.id,
    });
  }

  // Send to custom endpoint (implement as needed)
  if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      attribution: metric.attribution,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability (won't be cancelled on page unload)
    const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
    if (apiUrl) {
      navigator.sendBeacon(`${apiUrl}/web-vitals`, body);
    }
  }

  // Send to Google Analytics (if available)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  }
}

/**
 * Process and report metric
 */
function reportMetric(metric: Metric) {
  const report: WebVitalsReport = {
    ...metric,
    rating: getMetricRating(metric.name as MetricName, metric.value),
  };

  sendToAnalytics(report);
}

/**
 * Initialize Web Vitals tracking
 * Call this in your _app.tsx or root layout
 */
export function initWebVitals() {
  try {
    onCLS(reportMetric);
    onFID(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  } catch (error) {
    console.error('Error initializing Web Vitals:', error);
  }
}

/**
 * Export individual metric listeners for custom usage
 */
export const webVitalsListeners = {
  onCLS,
  onFID,
  onINP,
  onLCP,
  onFCP,
  onTTFB,
};

/**
 * Get performance navigation timing
 */
export function getNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;

  return {
    // DNS resolution time
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP connection time
    tcp: navigation.connectEnd - navigation.connectStart,
    // TLS negotiation time
    tls: navigation.secureConnectionStart > 0
      ? navigation.connectEnd - navigation.secureConnectionStart
      : 0,
    // Request time
    request: navigation.responseStart - navigation.requestStart,
    // Response time
    response: navigation.responseEnd - navigation.responseStart,
    // DOM processing time
    domProcessing: navigation.domComplete - navigation.domInteractive,
    // Total load time
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
  };
}

/**
 * Get resource timing summary
 */
export function getResourceTimingSummary() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const summary = {
    total: resources.length,
    byType: {} as Record<string, number>,
    largestResources: [] as Array<{ name: string; size: number; duration: number }>,
  };

  resources.forEach((resource) => {
    // Count by initiator type
    const type = resource.initiatorType || 'other';
    summary.byType[type] = (summary.byType[type] || 0) + 1;
  });

  // Get 10 largest resources
  summary.largestResources = resources
    .map((r) => ({
      name: r.name.split('/').pop() || r.name,
      size: r.transferSize || 0,
      duration: r.duration,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  return summary;
}
