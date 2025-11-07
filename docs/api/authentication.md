# Autentykacja i Autoryzacja

## Wprowadzenie

Multimedia Portal wykorzystuje JWT (JSON Web Tokens) do autentykacji oraz system RBAC (Role-Based Access Control) do autoryzacji.

## JWT Authentication

### Struktura Token

#### Access Token
- **Czas życia**: 15 minut (configurable)
- **Algorytm**: HS256
- **Secret**: `JWT_SECRET` environment variable

**Payload**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1609459200,
  "exp": 1609460100
}
```

#### Refresh Token
- **Czas życia**: 7 dni (configurable)
- **Stored in**: Database (Session table)
- **Used for**: Obtaining new access tokens

### Flow Autentykacji

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Backend │
└────┬────┘                                    └────┬────┘
     │                                              │
     │ 1. POST /auth/login                         │
     │ { email, password }                         │
     ├────────────────────────────────────────────>│
     │                                              │
     │                                  2. Verify  │
     │                                   password  │
     │                                   (bcrypt)  │
     │                                              │
     │ 3. Return tokens                            │
     │ { accessToken, refreshToken, user }         │
     │<────────────────────────────────────────────┤
     │                                              │
     │ 4. Store tokens                             │
     │    (localStorage)                           │
     │                                              │
     │ 5. API Request                              │
     │ Authorization: Bearer <accessToken>         │
     ├────────────────────────────────────────────>│
     │                                              │
     │                                  6. Validate│
     │                                     JWT     │
     │                                              │
     │ 7. Response                                 │
     │<────────────────────────────────────────────┤
     │                                              │
     │ 8. Token expired (401)                      │
     │<────────────────────────────────────────────┤
     │                                              │
     │ 9. POST /auth/refresh                       │
     │ { refreshToken }                            │
     ├────────────────────────────────────────────>│
     │                                              │
     │ 10. New accessToken                         │
     │<────────────────────────────────────────────┤
     │                                              │
```

### Implementacja Backend

#### JWT Strategy (`jwt.strategy.ts`)

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Payload jest automatycznie zdekodowany
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

#### Auth Service

```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    // 1. Znajdź użytkownika
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Weryfikuj hasło
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generuj tokeny
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // 4. Zapisz sesję
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 5. Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // 1. Sprawdź czy email istnieje
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash hasła
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 3. Utwórz użytkownika
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        name: registerDto.name,
        role: 'USER',
      },
    });

    // 4. Generuj tokeny
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // 5. Zapisz sesję
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // 1. Zweryfikuj refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // 2. Znajdź sesję
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 3. Sprawdź czy nie wygasła
      if (session.expiresAt < new Date()) {
        await this.prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedException('Refresh token expired');
      }

      // 4. Generuj nowy access token
      const accessToken = this.generateAccessToken(session.user);

      // 5. Update sesji
      await this.prisma.session.update({
        where: { id: session.id },
        data: { token: accessToken },
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async logout(userId: string) {
    // Usuń wszystkie sesje użytkownika
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }
}
```

### Implementacja Frontend

#### Token Storage (`lib/auth.ts`)

```typescript
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getUserFromToken(): JwtPayload | null {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}
```

#### Axios Interceptor (`lib/api/api.ts`)

```typescript
// Request interceptor - dodaj JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Jeśli refresh już trwa, dodaj do kolejki
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        setToken(accessToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        removeToken();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
ADMIN
  │
  ├─ Full access to all resources
  ├─ User management
  ├─ System settings
  └─ Content management
     │
     └─ MODERATOR
           │
           ├─ Content creation/editing
           ├─ Comment moderation
           └─ Basic content management
                 │
                 └─ USER
                       │
                       ├─ View content
                       ├─ Comment
                       └─ Rate content
```

### Permission Matrix

| Action | USER | MODERATOR | ADMIN |
|--------|------|-----------|-------|
| View published content | ✅ | ✅ | ✅ |
| Comment on content | ✅ | ✅ | ✅ |
| Rate content | ✅ | ✅ | ✅ |
| Create content | ❌ | ✅ | ✅ |
| Edit own content | ❌ | ✅ | ✅ |
| Edit any content | ❌ | ❌ | ✅ |
| Delete own content | ❌ | ✅ | ✅ |
| Delete any content | ❌ | ❌ | ✅ |
| Moderate comments | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ✅ |

### Guards Implementation

#### JwtAuthGuard (`jwt-auth.guard.ts`)

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Sprawdź czy route jest publiczny
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
```

#### RolesGuard (`roles.guard.ts`)

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Pobierz wymagane role z metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Brak wymaganych ról = dostęp dla wszystkich authenticated
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
```

### Decorators

#### @Public()
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### @Roles()
```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

#### @CurrentUser()
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### Usage Examples

#### Public Endpoint
```typescript
@Controller('articles')
export class ArticlesController {
  @Public()
  @Get()
  findAll() {
    // Dostępny dla wszystkich
  }
}
```

#### Authenticated Endpoint
```typescript
@Controller('comments')
export class CommentsController {
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('userId') userId: string) {
    // Wymaga autentykacji
  }
}
```

#### Role-Protected Endpoint
```typescript
@Controller('articles')
export class ArticlesController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post()
  create(@CurrentUser() user: User) {
    // Tylko dla ADMIN i MODERATOR
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    // Tylko dla ADMIN
  }
}
```

## Security Best Practices

### 1. Password Security

```typescript
// Strong password hashing
const hashedPassword = await bcrypt.hash(password, 10);

// Password validation rules
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
  });
```

### 2. Token Security

- **Never** store JWT secrets in code
- Use environment variables
- Rotate secrets periodically
- Use HTTPS in production
- Short-lived access tokens (15 min)
- HttpOnly cookies (production)

```typescript
// Cookie-based auth (production)
response.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
});
```

### 3. Rate Limiting

```typescript
// Throttle decorator
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
@Post('login')
login() {
  // Login logic
}
```

### 4. CORS Configuration

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 5. Input Validation

```typescript
// DTO with validation
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

### 6. Session Management

```typescript
// Cleanup expired sessions (Cron job)
@Cron('0 0 * * *') // Daily at midnight
async cleanupExpiredSessions() {
  await this.prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
```

### 7. Two-Factor Authentication (Future)

```typescript
// Generate TOTP secret
const secret = speakeasy.generateSecret();

// Verify TOTP token
const verified = speakeasy.totp.verify({
  secret: user.totpSecret,
  encoding: 'base32',
  token: totpToken,
});
```

## Error Handling

### Authentication Errors

```typescript
// 401 - Unauthorized
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}

// 401 - Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Authorization Errors

```typescript
// 403 - Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required roles: ADMIN",
  "error": "Forbidden"
}
```

## Testing

### Unit Tests

```typescript
describe('AuthService', () => {
  it('should login user with valid credentials', async () => {
    const result = await authService.login('user@example.com', 'password');

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('user@example.com');
  });

  it('should throw error with invalid credentials', async () => {
    await expect(
      authService.login('user@example.com', 'wrong')
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

### E2E Tests

```typescript
describe('Auth (e2e)', () => {
  it('POST /auth/login should return tokens', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });

  it('GET /auth/me should require authentication', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('GET /auth/me should return user with valid token', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email');
      });
  });
});
```

## Podsumowanie

System autentykacji i autoryzacji Multimedia Portal zapewnia:

- ✅ **JWT-based authentication** - Stateless, scalable
- ✅ **Token refresh mechanism** - Seamless UX
- ✅ **Role-based access control** - Flexible permissions
- ✅ **Password hashing** - Bcrypt for security
- ✅ **Guards & Decorators** - Clean, maintainable code
- ✅ **Frontend integration** - Automatic token handling
- ✅ **Security best practices** - Industry standards

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
