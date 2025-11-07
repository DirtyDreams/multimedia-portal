#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 *
 * Runs Lighthouse audits on key pages and generates reports
 * Usage: npm run lighthouse
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../lighthouse-reports');

// Pages to audit
const PAGES_TO_AUDIT = [
  { path: '/', name: 'home' },
  { path: '/articles', name: 'articles-list' },
  { path: '/blog', name: 'blog-list' },
  { path: '/wiki', name: 'wiki-list' },
  { path: '/gallery', name: 'gallery' },
  { path: '/login', name: 'login' },
  { path: '/dashboard', name: 'dashboard' },
];

// Lighthouse options
const lighthouseOptions = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

// Core Web Vitals thresholds
const THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  'first-contentful-paint': 1800,
  'largest-contentful-paint': 2500,
  'cumulative-layout-shift': 0.1,
  'total-blocking-time': 200,
  'speed-index': 3400,
};

async function launchChromeAndRunLighthouse(url, options) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  options.port = chrome.port;

  try {
    const runnerResult = await lighthouse(url, options);
    await chrome.kill();
    return runnerResult;
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

function generateReport(results) {
  const summary = {
    url: results.lhr.finalUrl,
    fetchTime: results.lhr.fetchTime,
    scores: {},
    metrics: {},
    passed: true,
  };

  // Extract scores
  Object.keys(results.lhr.categories).forEach((category) => {
    const score = results.lhr.categories[category].score * 100;
    summary.scores[category] = Math.round(score);

    if (THRESHOLDS[category] && score < THRESHOLDS[category]) {
      summary.passed = false;
    }
  });

  // Extract key metrics
  const metrics = results.lhr.audits;
  summary.metrics = {
    'first-contentful-paint': metrics['first-contentful-paint']?.numericValue,
    'largest-contentful-paint': metrics['largest-contentful-paint']?.numericValue,
    'cumulative-layout-shift': metrics['cumulative-layout-shift']?.numericValue,
    'total-blocking-time': metrics['total-blocking-time']?.numericValue,
    'speed-index': metrics['speed-index']?.numericValue,
    'interactive': metrics['interactive']?.numericValue,
  };

  // Check metrics against thresholds
  Object.entries(summary.metrics).forEach(([metric, value]) => {
    if (THRESHOLDS[metric] && value > THRESHOLDS[metric]) {
      summary.passed = false;
    }
  });

  return summary;
}

function saveReport(pageName, results) {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Save HTML report
  const htmlReport = results.report;
  const htmlPath = path.join(OUTPUT_DIR, `${pageName}.html`);
  fs.writeFileSync(htmlPath, htmlReport);

  // Save JSON report
  const jsonPath = path.join(OUTPUT_DIR, `${pageName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results.lhr, null, 2));

  console.log(`✓ Reports saved: ${htmlPath}`);
}

function printSummary(summary) {
  console.log('\n' + '='.repeat(60));
  console.log(`URL: ${summary.url}`);
  console.log('='.repeat(60));

  console.log('\n📊 Scores:');
  Object.entries(summary.scores).forEach(([category, score]) => {
    const threshold = THRESHOLDS[category];
    const icon = threshold && score >= threshold ? '✅' : '❌';
    console.log(`  ${icon} ${category}: ${score}/100`);
  });

  console.log('\n⚡ Core Web Vitals:');
  Object.entries(summary.metrics).forEach(([metric, value]) => {
    const threshold = THRESHOLDS[metric];
    let displayValue = value;

    if (metric === 'cumulative-layout-shift') {
      displayValue = value.toFixed(3);
    } else {
      displayValue = `${Math.round(value)}ms`;
    }

    const icon = threshold && value <= threshold ? '✅' : '❌';
    console.log(`  ${icon} ${metric}: ${displayValue}`);
  });

  console.log('\n' + (summary.passed ? '✅ PASSED' : '❌ FAILED') + '\n');
}

async function runAudit() {
  console.log('🚀 Starting Lighthouse Audits...\n');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Pages to audit: ${PAGES_TO_AUDIT.length}\n`);

  const allResults = [];
  let allPassed = true;

  for (const page of PAGES_TO_AUDIT) {
    const url = `${BASE_URL}${page.path}`;
    console.log(`\n🔍 Auditing: ${url}`);

    try {
      const results = await launchChromeAndRunLighthouse(url, lighthouseOptions);
      const summary = generateReport(results);

      saveReport(page.name, results);
      printSummary(summary);

      allResults.push({ page: page.name, summary });

      if (!summary.passed) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Error auditing ${url}:`, error.message);
      allPassed = false;
    }
  }

  // Save summary report
  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log(`📁 Reports saved to: ${OUTPUT_DIR}`);
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run the audit
runAudit().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
