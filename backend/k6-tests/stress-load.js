/**
 * k6 Stress Load Test
 *
 * Tests API performance under high stress conditions
 * - Ramps up from 0 to 100 concurrent users over 2 minutes
 * - Sustains 100 users for 5 minutes
 * - Ramps down over 2 minutes
 * - Identifies breaking points and performance degradation
 *
 * Run: k6 run stress-load.js
 * Run with custom URL: k6 run -e API_URL=http://your-api.com stress-load.js
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
  // Stress load: gradually increase to 100 concurrent users
  stages: [
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp down to 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],

  // Performance thresholds (slightly relaxed for stress test)
  thresholds: {
    'http_req_duration': ['avg<800', 'p(95)<1500'],  // Allow higher response times under stress
    'http_req_duration{type:api}': ['p(95)<1500'],
    'http_req_failed': ['rate<0.05'],  // Allow up to 5% error rate under stress
    'http_req_blocked': ['avg<100'],
    'http_req_connecting': ['avg<100'],
    'http_req_sending': ['avg<20'],
    'http_req_waiting': ['avg<700'],
    'http_req_receiving': ['avg<100'],
  },

  // Tags for categorizing metrics
  tags: {
    testType: 'stress-load',
  },

  // Summary output
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Setup function - runs once before test
export function setup() {
  console.log('🔥 Starting Stress Load Test');
  console.log(`API URL: ${BASE_URL}`);
  console.log('Configuration: 0 → 100 VUs over 15 minutes');

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

  // Simulate intensive user journey with mixed read/write operations
  const headers = authHeaders(token);

  // 1. List articles (high frequency operation)
  const articlesRes = http.get(`${BASE_URL}/articles?page=1&limit=20`, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'list-articles', type: 'api' },
  });

  check(articlesRes, {
    'stress list articles status 200': (r) => r.status === 200,
  });

  sleep(randomSleep(0.5, 1.5));

  // 2. View multiple articles (simulate rapid browsing)
  if (articlesRes.status === 200) {
    const articlesData = JSON.parse(articlesRes.body);

    if (articlesData.data && articlesData.data.length > 0) {
      // View 2-3 random articles
      const numArticlesToView = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < Math.min(numArticlesToView, articlesData.data.length); i++) {
        const article = articlesData.data[i];

        const articleRes = http.get(`${BASE_URL}/articles/${article.id}`, {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'get-article', type: 'api' },
        });

        check(articleRes, {
          'stress get article status 200': (r) => r.status === 200,
        });

        sleep(randomSleep(0.5, 1));

        // Load comments for some articles
        if (Math.random() < 0.6) {
          const commentsRes = http.get(
            `${BASE_URL}/comments?contentType=ARTICLE&contentId=${article.id}`,
            {
              headers: { 'Content-Type': 'application/json' },
              tags: { name: 'list-comments', type: 'api' },
            }
          );

          check(commentsRes, {
            'stress list comments status 200': (r) => r.status === 200,
          });

          sleep(randomSleep(0.3, 0.8));
        }
      }

      // 3. Create comments (write operations - 15% of users)
      if (Math.random() < 0.15) {
        const randomArticle = articlesData.data[Math.floor(Math.random() * articlesData.data.length)];
        const commentPayload = JSON.stringify(generateComment('ARTICLE', randomArticle.id));

        const createCommentRes = http.post(`${BASE_URL}/comments`, commentPayload, {
          headers,
          tags: { name: 'create-comment', type: 'api' },
        });

        check(createCommentRes, {
          'stress create comment success': (r) => r.status === 201 || r.status === 200,
        });

        sleep(randomSleep(0.5, 1));
      }

      // 4. Create ratings (write operations - 10% of users)
      if (Math.random() < 0.1) {
        const randomArticle = articlesData.data[Math.floor(Math.random() * articlesData.data.length)];
        const ratingPayload = JSON.stringify(generateRating('ARTICLE', randomArticle.id));

        const createRatingRes = http.post(`${BASE_URL}/ratings`, ratingPayload, {
          headers,
          tags: { name: 'create-rating', type: 'api' },
        });

        check(createRatingRes, {
          'stress create rating success': (r) => r.status === 201 || r.status === 200,
        });

        sleep(randomSleep(0.5, 1));
      }
    }
  }

  // 5. Browse authors (moderate frequency)
  if (Math.random() < 0.3) {
    const authorsRes = http.get(`${BASE_URL}/authors?page=1&limit=10`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'list-authors', type: 'api' },
    });

    check(authorsRes, {
      'stress list authors status 200': (r) => r.status === 200,
    });

    sleep(randomSleep(0.3, 0.8));
  }

  // 6. Search operations (moderate frequency)
  if (Math.random() < 0.2) {
    const searchQueries = ['test', 'article', 'news', 'guide', 'tutorial'];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    const searchRes = http.get(`${BASE_URL}/articles?search=${randomQuery}&page=1&limit=10`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'search-articles', type: 'api' },
    });

    check(searchRes, {
      'stress search articles status 200': (r) => r.status === 200,
    });

    sleep(randomSleep(0.5, 1));
  }

  // 7. Get ratings statistics (moderate frequency)
  if (Math.random() < 0.2) {
    const ratingsRes = http.get(`${BASE_URL}/ratings?page=1&limit=20`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'list-ratings', type: 'api' },
    });

    check(ratingsRes, {
      'stress list ratings status 200': (r) => r.status === 200,
    });

    sleep(randomSleep(0.3, 0.8));
  }

  // Shorter think time under stress
  sleep(randomSleep(1, 3));
}

// Teardown function - runs once after test
export function teardown(data) {
  const durationSeconds = (Date.now() - data.timestamp) / 1000;
  console.log('✅ Stress Load Test Complete');
  console.log(`Test duration: ${durationSeconds}s (${(durationSeconds / 60).toFixed(1)} minutes)`);
  console.log('Check the output for performance degradation patterns');
}

// Helper function for random sleep
function randomSleep(min, max) {
  return Math.random() * (max - min) + min;
}
