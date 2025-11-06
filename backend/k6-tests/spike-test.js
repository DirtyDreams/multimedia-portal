/**
 * k6 Spike Test
 *
 * Tests API performance under sudden traffic spikes
 * - Starts with 10 users (normal load)
 * - Suddenly spikes to 200 users
 * - Sustains spike for 1 minute
 * - Returns to normal load
 * - Tests system recovery and resilience
 *
 * Run: k6 run spike-test.js
 * Run with custom URL: k6 run -e API_URL=http://your-api.com spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  BASE_URL,
  thresholds,
  randomTestUser,
  login,
  authHeaders,
  generateArticle,
  generateComment,
  generateRating,
  checkResponse,
} from './config.js';

// Test configuration
export const options = {
  // Spike test: sudden traffic surge
  stages: [
    { duration: '1m', target: 10 },   // Start with normal load
    { duration: '10s', target: 200 }, // Sudden spike to 200 users!
    { duration: '1m', target: 200 },  // Sustain spike for 1 minute
    { duration: '10s', target: 10 },  // Quick recovery to normal
    { duration: '1m', target: 10 },   // Verify system recovery
    { duration: '10s', target: 0 },   // Ramp down
  ],

  // Performance thresholds (relaxed for spike conditions)
  thresholds: {
    'http_req_duration': ['avg<1000', 'p(95)<2000'],  // Allow higher latency during spike
    'http_req_duration{type:api}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.1'],  // Allow up to 10% error rate during spike
    'http_req_blocked': ['avg<200'],
    'http_req_connecting': ['avg<200'],
  },

  // Tags for categorizing metrics
  tags: {
    testType: 'spike-test',
  },

  // Summary output
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Setup function - runs once before test
export function setup() {
  console.log('⚡ Starting Spike Test');
  console.log(`API URL: ${BASE_URL}`);
  console.log('Configuration: 10 → 200 → 10 VUs (sudden spike)');

  return {
    timestamp: Date.now(),
    spikeStart: null,
    spikeEnd: null,
  };
}

// Main test function - runs for each virtual user
export default function (data) {
  // Login as a test user
  const user = randomTestUser();
  const token = login(http, user);

  if (!token) {
    console.error('Failed to login during spike');
    return;
  }

  // Simulate aggressive user behavior during spike
  const headers = authHeaders(token);

  // 1. Quick article browsing (high frequency)
  const articlesRes = http.get(`${BASE_URL}/articles?page=1&limit=20`, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'list-articles', type: 'api', spike: 'true' },
  });

  check(articlesRes, {
    'spike list articles success': (r) => r.status === 200 || r.status === 503,  // Allow 503 during spike
  });

  // Minimal sleep during spike
  sleep(randomSleep(0.2, 0.5));

  // 2. Rapid article viewing
  if (articlesRes.status === 200) {
    const articlesData = JSON.parse(articlesRes.body);

    if (articlesData.data && articlesData.data.length > 0) {
      const randomArticle = articlesData.data[Math.floor(Math.random() * articlesData.data.length)];

      const articleRes = http.get(`${BASE_URL}/articles/${randomArticle.id}`, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'get-article', type: 'api', spike: 'true' },
      });

      check(articleRes, {
        'spike get article success': (r) => r.status === 200 || r.status === 503,
      });

      sleep(randomSleep(0.2, 0.5));

      // 3. Comments (high read frequency during spike)
      if (Math.random() < 0.7) {
        const commentsRes = http.get(
          `${BASE_URL}/comments?contentType=ARTICLE&contentId=${randomArticle.id}`,
          {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'list-comments', type: 'api', spike: 'true' },
          }
        );

        check(commentsRes, {
          'spike list comments success': (r) => r.status === 200 || r.status === 503,
        });

        sleep(randomSleep(0.1, 0.3));
      }

      // 4. Write operations (some users still create content)
      if (Math.random() < 0.2) {
        const commentPayload = JSON.stringify(generateComment('ARTICLE', randomArticle.id));

        const createCommentRes = http.post(`${BASE_URL}/comments`, commentPayload, {
          headers,
          tags: { name: 'create-comment', type: 'api', spike: 'true' },
        });

        check(createCommentRes, {
          'spike create comment accepted': (r) => r.status === 201 || r.status === 200 || r.status === 503,
        });

        sleep(randomSleep(0.2, 0.5));
      }

      // 5. Ratings (some users still rate)
      if (Math.random() < 0.15) {
        const ratingPayload = JSON.stringify(generateRating('ARTICLE', randomArticle.id));

        const createRatingRes = http.post(`${BASE_URL}/ratings`, ratingPayload, {
          headers,
          tags: { name: 'create-rating', type: 'api', spike: 'true' },
        });

        check(createRatingRes, {
          'spike create rating accepted': (r) => r.status === 201 || r.status === 200 || r.status === 503,
        });

        sleep(randomSleep(0.2, 0.5));
      }
    }
  }

  // 6. Search operations (moderate during spike)
  if (Math.random() < 0.3) {
    const searchRes = http.get(`${BASE_URL}/articles?search=test&page=1&limit=10`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'search-articles', type: 'api', spike: 'true' },
    });

    check(searchRes, {
      'spike search success': (r) => r.status === 200 || r.status === 503,
    });

    sleep(randomSleep(0.2, 0.5));
  }

  // 7. Browse authors (low frequency)
  if (Math.random() < 0.2) {
    const authorsRes = http.get(`${BASE_URL}/authors?page=1&limit=10`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'list-authors', type: 'api', spike: 'true' },
    });

    check(authorsRes, {
      'spike list authors success': (r) => r.status === 200 || r.status === 503,
    });

    sleep(randomSleep(0.2, 0.5));
  }

  // Very short think time during spike
  sleep(randomSleep(0.5, 1.5));
}

// Teardown function - runs once after test
export function teardown(data) {
  const durationSeconds = (Date.now() - data.timestamp) / 1000;
  console.log('✅ Spike Test Complete');
  console.log(`Test duration: ${durationSeconds}s (${(durationSeconds / 60).toFixed(1)} minutes)`);
  console.log('Analysis:');
  console.log('- Check if system handled the sudden spike');
  console.log('- Verify error rates during spike period');
  console.log('- Confirm system recovered after spike ended');
  console.log('- Look for response time degradation patterns');
}

// Helper function for random sleep
function randomSleep(min, max) {
  return Math.random() * (max - min) + min;
}
