import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';

const pages = [
  { name: 'Homepage', url: 'http://localhost:3000/' },
  { name: 'Articles', url: 'http://localhost:3000/articles' },
  { name: 'Blog', url: 'http://localhost:3000/blog' },
  { name: 'Login', url: 'http://localhost:3000/login' },
];

const lighthouseOptions = {
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  output: 'json',
  port: undefined, // Will be set dynamically
};

const chromeFlags = [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
];

async function runAudit(page) {
  console.log(`\n🔍 Running Lighthouse audit for: ${page.name}`);

  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags,
  });

  lighthouseOptions.port = chrome.port;

  try {
    const result = await lighthouse(page.url, lighthouseOptions);

    // Save full report
    const reportDir = 'lighthouse-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filename = `${reportDir}/${page.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    fs.writeFileSync(filename, result.report);

    // Extract scores
    const scores = {
      performance: result.lhr.categories.performance.score * 100,
      accessibility: result.lhr.categories.accessibility.score * 100,
      bestPractices: result.lhr.categories['best-practices'].score * 100,
      seo: result.lhr.categories.seo.score * 100,
    };

    // Extract key metrics
    const metrics = {
      'First Contentful Paint': result.lhr.audits['first-contentful-paint'].displayValue,
      'Largest Contentful Paint': result.lhr.audits['largest-contentful-paint'].displayValue,
      'Cumulative Layout Shift': result.lhr.audits['cumulative-layout-shift'].displayValue,
      'Total Blocking Time': result.lhr.audits['total-blocking-time'].displayValue,
      'Speed Index': result.lhr.audits['speed-index'].displayValue,
    };

    console.log(`\n📊 ${page.name} Scores:`);
    console.log(`  Performance: ${scores.performance.toFixed(0)}`);
    console.log(`  Accessibility: ${scores.accessibility.toFixed(0)}`);
    console.log(`  Best Practices: ${scores.bestPractices.toFixed(0)}`);
    console.log(`  SEO: ${scores.seo.toFixed(0)}`);

    console.log(`\n⚡ Core Web Vitals:`);
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    return { page: page.name, scores, metrics, filename };
  } finally {
    await chrome.kill();
  }
}

async function main() {
  console.log('🚀 Starting Lighthouse Audit');
  console.log('='.repeat(50));

  const results = [];

  for (const page of pages) {
    try {
      const result = await runAudit(page);
      results.push(result);
    } catch (error) {
      console.error(`\n❌ Error auditing ${page.name}:`, error.message);
      results.push({ page: page.name, error: error.message });
    }
  }

  // Summary
  console.log('\n\n📈 AUDIT SUMMARY');
  console.log('='.repeat(50));

  const summary = {
    timestamp: new Date().toISOString(),
    results: results,
  };

  fs.writeFileSync('lighthouse-reports/summary.json', JSON.stringify(summary, null, 2));

  console.log('\n✅ Audit completed!');
  console.log(`   Results saved to: lighthouse-reports/`);

  // Check if all pages meet the > 90 threshold
  const failingPages = results.filter(r => r.scores && r.scores.performance < 90);

  if (failingPages.length > 0) {
    console.log('\n⚠️  Pages with Performance < 90:');
    failingPages.forEach(page => {
      console.log(`   - ${page.page}: ${page.scores.performance.toFixed(0)}`);
    });
  } else {
    console.log('\n🎉 All pages have Performance score >= 90!');
  }
}

main().catch(console.error);
