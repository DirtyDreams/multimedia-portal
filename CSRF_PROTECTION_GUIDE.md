# CSRF Protection Guide

## Overview

This application implements CSRF (Cross-Site Request Forgery) protection using the **Double Submit Cookie** pattern. This guide explains how CSRF protection works and how to use it.

---

## How It Works

### Double Submit Cookie Pattern

1. **Server generates token**: When a client makes a GET request, the server generates a random CSRF token and sends it as a cookie
2. **Client reads token**: The JavaScript client reads the token from the cookie
3. **Client sends token in header**: For all state-changing requests (POST, PUT, PATCH, DELETE), the client includes the token in the `X-CSRF-Token` header
4. **Server validates**: The server compares the cookie token with the header token to ensure they match

**Why this works**: Attackers cannot read cookies from other domains due to Same-Origin Policy, so they cannot obtain the CSRF token to include in malicious requests.

---

## Backend Implementation

### Files Created

1. **`/backend/src/common/guards/csrf.guard.ts`** - CSRF protection guard
2. **`/backend/src/common/controllers/csrf.controller.ts`** - Endpoint to retrieve CSRF token

### Current Status

✅ CSRF protection is **implemented** but **disabled by default**
⚠️ To enable globally, uncomment the code in `app.module.ts` (see below)

### Enabling CSRF Protection

#### Option 1: Enable Globally (Recommended for Production)

Edit `/backend/src/app.module.ts`:

```typescript
// UNCOMMENT these lines:
import { CsrfGuard } from './common/guards/csrf.guard';

@Module({
  // ...
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // UNCOMMENT THIS:
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
```

This enables CSRF protection for **all endpoints** except those decorated with `@Public()`.

#### Option 2: Enable on Specific Controllers

Apply `@UseGuards(CsrfGuard)` to specific controllers or routes:

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { CsrfGuard } from '../common/guards/csrf.guard';

@Controller('articles')
@UseGuards(CsrfGuard) // Apply CSRF protection to all routes in this controller
export class ArticlesController {
  // ...
}
```

Or on specific routes:

```typescript
@Post()
@UseGuards(CsrfGuard) // Only this route requires CSRF token
async create(@Body() dto: CreateDto) {
  // ...
}
```

---

## Frontend Integration

### Step 1: Get CSRF Token

Make a GET request to `/api/csrf/token`:

```typescript
// Get CSRF token
const response = await fetch('http://localhost:3000/api/csrf/token', {
  credentials: 'include', // IMPORTANT: Send cookies
});

const data = await response.json();
console.log(data);
// {
//   csrfToken: "a1b2c3d4e5f6...",
//   message: "CSRF token generated..."
// }
```

The token is automatically set as a cookie (`csrf-token`).

### Step 2: Read Token from Cookie

```typescript
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }
  return null;
}

const csrfToken = getCsrfTokenFromCookie();
```

### Step 3: Include Token in Requests

For all state-changing requests (POST, PUT, PATCH, DELETE), include the token in the `X-CSRF-Token` header:

```typescript
// Using fetch
await fetch('http://localhost:3000/api/articles', {
  method: 'POST',
  credentials: 'include', // Send cookies
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Include CSRF token
  },
  body: JSON.stringify({ title: 'New Article', content: '...' }),
});

// Using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Send cookies
});

// Add CSRF token to all requests
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Now all requests include CSRF token
await api.post('/articles', { title: 'New Article', content: '...' });
```

### Complete Example (React/Next.js)

```typescript
// lib/csrf.ts
export async function getCsrfToken(): Promise<string> {
  // Check if token exists in cookie
  let token = getCsrfTokenFromCookie();

  // If not, fetch from server
  if (!token) {
    const response = await fetch('/api/csrf/token', {
      credentials: 'include',
    });
    const data = await response.json();
    token = data.csrfToken;
  }

  return token;
}

function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }
  return null;
}

// lib/api.ts
import axios from 'axios';
import { getCsrfToken } from './csrf';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Add CSRF token interceptor
api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
    const csrfToken = await getCsrfToken();
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export default api;

// Usage in components
import api from '@/lib/api';

async function createArticle() {
  const response = await api.post('/articles', {
    title: 'My Article',
    content: 'Content here...',
  });
  return response.data;
}
```

---

## Testing CSRF Protection

### Test 1: Valid Request (Should Succeed)

```bash
# Get CSRF token
curl -c cookies.txt http://localhost:3000/api/csrf/token

# Extract token from cookie file
TOKEN=$(grep csrf-token cookies.txt | awk '{print $7}')

# Make POST request with token
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"title":"Test","content":"Test content"}' \
  http://localhost:3000/api/articles
```

Expected: `201 Created` response

### Test 2: Missing Token (Should Fail)

```bash
curl -c cookies.txt http://localhost:3000/api/csrf/token

# POST without X-CSRF-Token header
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}' \
  http://localhost:3000/api/articles
```

Expected: `403 Forbidden` with error message

### Test 3: Invalid Token (Should Fail)

```bash
curl -c cookies.txt http://localhost:3000/api/csrf/token

# POST with wrong token
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid-token-123" \
  -d '{"title":"Test","content":"Test content"}' \
  http://localhost:3000/api/articles
```

Expected: `403 Forbidden` with error message

---

## Configuration

### Cookie Settings

CSRF token cookie is configured with these settings (in `csrf.guard.ts` and `csrf.controller.ts`):

```typescript
{
  httpOnly: false,     // Must be false so JavaScript can read it
  secure: isProduction, // HTTPS only in production
  sameSite: 'strict',  // Strict same-site policy
  maxAge: 3600000,     // 1 hour expiration
  path: '/',           // Available for all routes
}
```

### Token Properties

- **Cookie name**: `csrf-token`
- **Header name**: `X-CSRF-Token`
- **Token length**: 32 bytes (64 hex characters)
- **Expiration**: 1 hour
- **Comparison**: Constant-time comparison to prevent timing attacks

---

## Security Considerations

### ✅ Protected Against

- **CSRF attacks**: Malicious sites cannot obtain or forge CSRF tokens
- **Timing attacks**: Uses constant-time comparison for token validation
- **Token theft**: Tokens expire after 1 hour

### ⚠️ Important Notes

1. **HTTPS Required in Production**: Set `secure: true` for cookies in production
2. **Same-Origin Policy**: CSRF protection relies on browsers enforcing SOP
3. **Token Rotation**: Tokens expire after 1 hour and are regenerated
4. **Safe Methods Exempted**: GET, HEAD, OPTIONS requests don't require CSRF token

### Not Protected Against

- **XSS attacks**: If attacker can execute JavaScript on your domain, they can read the CSRF token
  - **Mitigation**: Use input sanitization (already implemented) and Content Security Policy
- **Man-in-the-Middle**: If using HTTP instead of HTTPS
  - **Mitigation**: Always use HTTPS in production

---

## Troubleshooting

### Error: "CSRF token missing"

**Cause**: Client didn't include `X-CSRF-Token` header

**Solution**:
1. Get token from `/api/csrf/token` endpoint
2. Read token from `csrf-token` cookie
3. Include token in `X-CSRF-Token` header for POST/PUT/PATCH/DELETE

### Error: "CSRF token mismatch"

**Cause**: Token in cookie doesn't match token in header

**Solution**:
1. Ensure you're reading the correct cookie (`csrf-token`)
2. Check token hasn't expired (1 hour lifetime)
3. Verify you're including `credentials: 'include'` in fetch/axios

### Token Not Set

**Cause**: Cookie not being set by server

**Solution**:
1. Verify `cookie-parser` middleware is enabled in `main.ts`
2. Check CORS configuration allows credentials
3. Ensure `withCredentials: true` in client requests

---

## Production Deployment Checklist

- [ ] **Enable CSRF protection globally** in `app.module.ts`
- [ ] **Configure HTTPS** for production environment
- [ ] **Set `secure: true`** for cookies in production
- [ ] **Test CSRF protection** in staging environment
- [ ] **Update frontend** to include CSRF tokens
- [ ] **Monitor logs** for CSRF validation failures
- [ ] **Set up alerts** for suspicious CSRF-related activity

---

## Example Error Responses

### Missing Token
```json
{
  "statusCode": 403,
  "timestamp": "2025-11-07T10:30:00.000Z",
  "path": "/api/articles",
  "method": "POST",
  "message": "CSRF token missing. Include X-CSRF-Token header with the token from csrf-token cookie."
}
```

### Invalid Token
```json
{
  "statusCode": 403,
  "timestamp": "2025-11-07T10:30:00.000Z",
  "path": "/api/articles",
  "method": "POST",
  "message": "CSRF token mismatch. Invalid or expired token."
}
```

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

**Status**: ✅ CSRF Protection Implemented (Disabled by Default)
**To Enable**: Uncomment CsrfGuard in `app.module.ts`
**Production Ready**: Yes (after enabling)
