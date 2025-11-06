/**
 * k6 Normal Load Test
 *
 * Tests API performance under normal load conditions
 * - 10 concurrent virtual users
 * - 5 minute duration
 * - Simulates typical user behavior with read/write operations
 *
 * Run: k6 run normal-load.js
 * Run with custom URL: k6 run -e API_URL=http://your-api.com normal-load.js
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
  // Normal load: 10 concurrent users
  vus: 10,
  duration: '5m',

  // Performance thresholds
  thresholds,

  // Tags for categorizing metrics
  tags: {
    testType: 'normal-load',
  },

  // Summary output
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
};

// Setup function - runs once before test
export function setup() {
  console.log('🚀 Starting Normal Load Test');
  console.log(`API URL: ${BASE_URL}`);
  console.log('Configuration: 10 VUs, 5 minutes');

  // Register test users if needed (optional - depends on your setup)
  // In production, you should have pre-created test accounts

  return {
    timestamp: Date.now(),
  };
}

// Main test function - runs for each virtual user
export default function (data) {
  // Login as a test user
  const user = randomTestUser();
  const token = login(http, user);

  if (!token) {
    console.error('Failed to login');
    return;
  }

  // Simulate typical user journey
  const headers = authHeaders(token);

  // 1. Browse articles (most common operation - 40% of traffic)
  const articlesRes = http.get(`${BASE_URL}/articles?page=1&limit=20`, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'list-articles', type: 'api' },
  });

  check(articlesRes, {
    'list articles status 200': (r) => r.status === 200,
    'list articles has data': (r) => JSON.parse(r.body).data.length > 0,
  });

  sleep(randomSleep(1, 3));

  // 2. View specific article (30% of traffic)
  if (articlesRes.status === 200) {
    const articlesData = JSON.parse(articlesRes.body);
    if (articlesData.data && articlesData.data.length > 0) {
      const randomArticle = articlesData.data[0];

      const articleRes = http.get(`${BASE_URL}/articles/${randomArticle.id}`, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'get-article', type: 'api' },
      });

      check(articleRes, {
        'get article status 200': (r) => r.status === 200,
        'get article has title': (r) => JSON.parse(r.body).title !== undefined,
      });

      sleep(randomSleep(2, 5));

      // 3. View comments (20% of traffic)
      const commentsRes = http.get(
        `${BASE_URL}/comments?contentType=ARTICLE&contentId=${randomArticle.id}`,
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'list-comments', type: 'api' },
        }
      );

      check(commentsRes, {
        'list comments status 200': (r) => r.status === 200,
      });

      sleep(randomSleep(1, 2));

      // 4. Sometimes add a comment (5% of traffic)
      if (Math.random() < 0.05) {
        const commentPayload = JSON.stringify(generateComment('ARTICLE', randomArticle.id));

        const createCommentRes = http.post(`${BASE_URL}/comments`, commentPayload, {
          headers,
          tags: { name: 'create-comment', type: 'api' },
        });

        check(createCommentRes, {
          'create comment status 201': (r) => r.status === 201,
        });

        sleep(randomSleep(1, 2));
      }

      // 5. Sometimes add a rating (3% of traffic)
      if (Math.random() < 0.03) {
        const ratingPayload = JSON.stringify(generateRating('ARTICLE', randomArticle.id));

        const createRatingRes = http.post(`${BASE_URL}/ratings`, ratingPayload, {
          headers,
          tags: { name: 'create-rating', type: 'api' },
        });

        check(createRatingRes, {
          'create rating status 201 or 200': (r) => r.status === 201 || r.status === 200,
        });

        sleep(randomSleep(1, 2));
      }
    }
  }

  // 6. Browse authors (10% of traffic)
  if (Math.random() < 0.1) {
    const authorsRes = http.get(`${BASE_URL}/authors?page=1&limit=10`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'list-authors', type: 'api' },
    });

    check(authorsRes, {
      'list authors status 200': (r) => r.status === 200,
    });

    sleep(randomSleep(1, 2));
  }

  // 7. Search functionality (5% of traffic)
  if (Math.random() < 0.05) {
    const searchRes = http.get(`${BASE_URL}/articles?search=test&page=1&limit=10`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'search-articles', type: 'api' },
    });

    check(searchRes, {
      'search articles status 200': (r) => r.status === 200,
    });

    sleep(randomSleep(1, 3));
  }

  // Think time between iterations
  sleep(randomSleep(3, 7));
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log('✅ Normal Load Test Complete');
  console.log(`Test duration: ${(Date.now() - data.timestamp) / 1000}s`);
}

// Helper function for random sleep
function randomSleep(min, max) {
  return Math.random() * (max - min) + min;
}
