# HttpOnly Cookie Migration Plan

## Current Security Issue

**Critical Vulnerability**: JWT tokens are stored in `localStorage` (`frontend/src/lib/auth.ts:18-22`):

```typescript
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}
```

**Impact**:
- ❌ **XSS Vulnerability**: Any malicious script can steal tokens via `localStorage.getItem()`
- ❌ **Session Hijacking**: Stolen tokens enable complete account takeover
- ❌ **Persistent Storage**: Tokens remain even after browser restart
- ❌ **No CSRF Protection**: Vulnerable to cross-site request forgery

## Recommended Solution: HttpOnly Cookies

**Benefits**:
- ✅ **XSS Protection**: JavaScript cannot access httpOnly cookies
- ✅ **Automatic Transmission**: Browser sends cookies with every request
- ✅ **Secure Flag**: Ensures transmission only over HTTPS
- ✅ **SameSite**: Prevents CSRF attacks
- ✅ **Expiration**: Automatic cleanup on expiry

## Architecture Changes

### Before (Insecure)
```
Frontend (localStorage)
    ↓
  Request with Authorization header
    ↓
Backend validates JWT
```

### After (Secure)
```
Frontend (no token storage)
    ↓
  Request (cookies sent automatically)
    ↓
Backend validates JWT from cookie
```

## Implementation Steps

### Phase 1: Backend Changes

#### 1. Install Cookie Parser

```bash
cd backend
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

#### 2. Enable Cookie Parser in main.ts

Update `backend/src/main.ts`:

```typescript
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable cookie parser BEFORE other middleware
  app.use(cookieParser());

  // ... rest of configuration
}
```

#### 3. Update CORS Configuration

```typescript
app.enableCors({
  origin: configService.corsOrigin,
  credentials: true, // CRITICAL: Allow cookies in cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

#### 4. Create Cookie Helper Service

Create `backend/src/common/services/cookie.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '../../config/config.service';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

@Injectable()
export class CookieService {
  constructor(private configService: ConfigService) {}

  /**
   * Set JWT access token cookie
   */
  setAccessTokenCookie(response: Response, token: string, expiresIn: number): void {
    const options: CookieOptions = {
      httpOnly: true, // Prevent JavaScript access
      secure: this.configService.isProduction, // HTTPS only in production
      sameSite: this.configService.isProduction ? 'strict' : 'lax',
      maxAge: expiresIn * 1000, // Convert to milliseconds
      path: '/', // Available for all routes
    };

    response.cookie('access_token', token, options);
  }

  /**
   * Set JWT refresh token cookie
   */
  setRefreshTokenCookie(response: Response, token: string, expiresIn: number): void {
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.configService.isProduction,
      sameSite: this.configService.isProduction ? 'strict' : 'lax',
      maxAge: expiresIn * 1000,
      path: '/api/auth/refresh', // Only available for refresh endpoint
    };

    response.cookie('refresh_token', token, options);
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(response: Response): void {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  }
}
```

#### 5. Update Auth Controller

Update `backend/src/modules/auth/auth.controller.ts`:

```typescript
import { Response } from 'express';
import { Res } from '@nestjs/common';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cookieService: CookieService, // Inject cookie service
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response, // NEW: Get response object
  ): Promise<Omit<AuthResponseDto, 'accessToken' | 'refreshToken'>> {
    const result = await this.authService.register(registerDto);

    // Set cookies instead of returning tokens
    this.cookieService.setAccessTokenCookie(
      response,
      result.accessToken,
      15 * 60, // 15 minutes
    );
    this.cookieService.setRefreshTokenCookie(
      response,
      result.refreshToken,
      7 * 24 * 60 * 60, // 7 days
    );

    // Return user info only (no tokens)
    return {
      user: result.user,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthResponseDto, 'accessToken' | 'refreshToken'>> {
    const result = await this.authService.login(loginDto);

    // Set cookies
    this.cookieService.setAccessTokenCookie(
      response,
      result.accessToken,
      15 * 60,
    );
    this.cookieService.setRefreshTokenCookie(
      response,
      result.refreshToken,
      7 * 24 * 60 * 60,
    );

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('userId') userId: string,
    @CurrentUser('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, token);

    // Clear cookies
    this.cookieService.clearAuthCookies(response);

    return { message: 'Successfully logged out' };
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    // Get refresh token from cookie
    const refreshToken = request.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(refreshToken);

    // Set new access token cookie
    this.cookieService.setAccessTokenCookie(
      response,
      result.accessToken,
      15 * 60,
    );

    return { message: 'Token refreshed successfully' };
  }
}
```

#### 6. Update JWT Strategy

Update `backend/src/modules/auth/strategies/jwt.strategy.ts` to read token from cookies:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '../../../config/config.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // NEW: Extract JWT from cookie OR Authorization header (for backward compatibility)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.['access_token'];
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
      passReqToCallback: true, // Need request object to get token
    });
  }

  async validate(request: Request, payload: any) {
    // Get token from cookie or header
    const token = request.cookies?.['access_token'] ||
      request.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if token is valid in session table
    const session = await this.prisma.session.findFirst({
      where: {
        userId: user.id,
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      token, // Include token for logout
    };
  }
}
```

### Phase 2: Frontend Changes

#### 1. Update API Configuration

Update `frontend/src/lib/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true, // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove token refresh interceptor logic since cookies are handled automatically
// Backend will automatically read access_token from cookies

// Keep error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await api.post('/auth/refresh'); // Cookie sent automatically
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

#### 2. Update Auth Helper

Update `frontend/src/lib/auth.ts`:

```typescript
// Remove all localStorage token management functions
// Tokens are now handled by httpOnly cookies

/**
 * Check if user is authenticated by calling /auth/me
 * Cookie is sent automatically
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await api.get('/auth/me');
    return !!response.data;
  } catch {
    return false;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Login user
 * Tokens are set as httpOnly cookies by backend
 */
export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // Returns user info only
}

/**
 * Register user
 * Tokens are set as httpOnly cookies by backend
 */
export async function register(userData: any) {
  const response = await api.post('/auth/register', userData);
  return response.data; // Returns user info only
}

/**
 * Logout user
 * Clears httpOnly cookies on backend
 */
export async function logout() {
  await api.post('/auth/logout');
}
```

#### 3. Update Auth Provider

Update `frontend/src/providers/auth-provider.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### 4. Update Login Component

Example update for login page:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await login(
        formData.get('email') as string,
        formData.get('password') as string,
      );

      // Refetch user data
      await refetch();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Phase 3: CSRF Protection (Recommended)

#### 1. Install CSRF Package

```bash
cd backend
npm install @nestjs/csrf
```

#### 2. Configure CSRF

Update `backend/src/main.ts`:

```typescript
import { CsrfModule } from '@nestjs/csrf';

// In AppModule
@Module({
  imports: [
    // ... other imports
    CsrfModule.forRoot({
      ttl: 3600, // 1 hour
    }),
  ],
})
export class AppModule {}
```

#### 3. Add CSRF Token Endpoint

```typescript
@Controller('csrf')
export class CsrfController {
  @Get('token')
  @Public()
  getCsrfToken(@CsrfToken() token: string) {
    return { csrfToken: token };
  }
}
```

#### 4. Frontend CSRF Integration

```typescript
// Get CSRF token on app load
const getCsrfToken = async () => {
  const response = await api.get('/csrf/token');
  return response.data.csrfToken;
};

// Include in all mutation requests
api.interceptors.request.use(async (config) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
    const token = await getCsrfToken();
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});
```

## Testing Checklist

### Backend Tests
- [ ] Cookies are set on login
- [ ] Cookies are set on register
- [ ] Cookies have correct httpOnly flag
- [ ] Cookies have correct secure flag (production)
- [ ] Cookies have correct sameSite attribute
- [ ] Token refresh works with cookies
- [ ] Logout clears cookies
- [ ] JWT strategy extracts token from cookies
- [ ] CORS allows credentials

### Frontend Tests
- [ ] Login works without localStorage
- [ ] Register works without localStorage
- [ ] API calls include cookies automatically
- [ ] Token refresh works automatically
- [ ] Logout clears authentication
- [ ] Protected routes work
- [ ] Dev tools show cookies (not accessible via JS)

### Security Tests
- [ ] JavaScript cannot access cookies
- [ ] XSS attack cannot steal tokens
- [ ] CSRF protection works
- [ ] Cookies only sent over HTTPS (production)
- [ ] Cookies expire correctly

## Migration Strategy

### Option 1: Hard Cutover (Recommended)
1. Deploy backend with cookie support
2. Deploy frontend with cookie usage
3. Existing sessions expire naturally (or force logout)

### Option 2: Dual-Mode (Transition Period)
1. Support both cookies and headers temporarily
2. Gradually migrate users to cookies
3. Remove header support after migration

## Rollback Plan

If issues occur:
1. Revert JWT strategy to only use Authorization header
2. Revert frontend to localStorage
3. Clear all user cookies
4. Users re-login with old method

## Production Deployment Checklist

- [ ] `CORS_ORIGIN` configured correctly
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Cookie parser installed
- [ ] CSRF protection enabled
- [ ] Session cleanup cron job running
- [ ] Monitoring for auth failures

## Security Improvements Summary

| Before (localStorage) | After (httpOnly Cookies) |
|-----------------------|--------------------------|
| ❌ XSS vulnerable     | ✅ XSS protected         |
| ❌ Manual transmission | ✅ Automatic transmission |
| ❌ No CSRF protection  | ✅ CSRF protected        |
| ❌ Persistent storage  | ✅ Expires automatically |
| ❌ Dev tools accessible | ✅ Hidden from JavaScript |

## Estimated Implementation Time

- **Backend**: 3-4 hours
- **Frontend**: 2-3 hours
- **Testing**: 2-3 hours
- **Total**: 7-10 hours

## Priority

**CRITICAL** - This is a severe security vulnerability that enables account takeover via XSS.

**Recommendation**: Implement ASAP before production deployment.
