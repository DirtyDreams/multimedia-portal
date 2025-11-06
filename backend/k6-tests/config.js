/**
 * k6 Load Test Configuration
 *
 * Shared configuration and utility functions for k6 load tests
 */

// API Base URL - can be overridden via environment variable
export const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

// Performance thresholds as per task requirements
export const thresholds = {
  // Average response time should be less than 500ms
  'http_req_duration': ['avg<500', 'p(95)<1000'],

  // 95th percentile should be less than 1s (1000ms)
  'http_req_duration{type:api}': ['p(95)<1000'],

  // Error rate should be less than 1%
  'http_req_failed': ['rate<0.01'],

  // Additional monitoring thresholds
  'http_req_blocked': ['avg<50'],  // Time waiting for connection
  'http_req_connecting': ['avg<50'], // Time establishing connection
  'http_req_sending': ['avg<10'],  // Time sending request
  'http_req_waiting': ['avg<400'], // Time waiting for response
  'http_req_receiving': ['avg<50'], // Time receiving response
};

// Test user credentials for load testing
// In production, you should use dedicated test accounts
export const testUsers = [
  {
    email: 'loadtest1@example.com',
    password: 'LoadTest123!',
    username: 'loadtester1',
    name: 'Load Tester 1',
  },
  {
    email: 'loadtest2@example.com',
    password: 'LoadTest123!',
    username: 'loadtester2',
    name: 'Load Tester 2',
  },
  {
    email: 'loadtest3@example.com',
    password: 'LoadTest123!',
    username: 'loadtester3',
    name: 'Load Tester 3',
  },
];

/**
 * Generate random test user
 */
export function randomTestUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

/**
 * Register a new test user (for setup)
 */
export function registerUser(http, user) {
  const registerPayload = JSON.stringify(user);

  const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { type: 'setup' },
  });

  return registerRes;
}

/**
 * Login and get access token
 */
export function login(http, user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { type: 'auth' },
  });

  if (loginRes.status === 200 || loginRes.status === 201) {
    const body = JSON.parse(loginRes.body);
    return body.accessToken;
  }

  return null;
}

/**
 * Get authorization headers
 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Random sleep between min and max seconds
 */
export function randomSleep(min, max) {
  const sleepTime = Math.random() * (max - min) + min;
  return sleepTime;
}

/**
 * Generate random article data
 */
export function generateArticle() {
  const timestamp = Date.now();
  return {
    title: `Load Test Article ${timestamp}`,
    content: 'This is a load test article content. '.repeat(20),
    excerpt: 'Load test excerpt',
    status: 'PUBLISHED',
    publishedAt: new Date().toISOString(),
  };
}

/**
 * Generate random comment data
 */
export function generateComment(contentType, contentId) {
  return {
    contentType,
    contentId,
    content: `Load test comment at ${Date.now()}`,
  };
}

/**
 * Generate random rating data
 */
export function generateRating(contentType, contentId) {
  return {
    contentType,
    contentId,
    value: Math.floor(Math.random() * 5) + 1, // 1-5
  };
}

/**
 * Check response status and log errors
 */
export function checkResponse(response, expectedStatus = 200) {
  const success = response.status === expectedStatus;
  if (!success) {
    console.error(`Request failed: ${response.status} ${response.url}`);
    console.error(`Response: ${response.body}`);
  }
  return success;
}

/**
 * Sleep for specified seconds
 */
export function sleep(seconds) {
  return seconds;
}
