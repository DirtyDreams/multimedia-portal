# Przegląd Architektury Multimedia Portal

## Wprowadzenie

Multimedia Portal to nowoczesna aplikacja full-stack zbudowana w architekturze mikroserwisowej z wykorzystaniem najnowszych technologii webowych. System składa się z trzech głównych warstw: Frontend (Next.js), Backend (NestJS) oraz warstwa danych (PostgreSQL + Redis + Meilisearch).

## Architektura High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────▼────────────────┐
         │      Nginx Reverse Proxy       │
         │        (Port 80/443)           │
         └───────┬──────────────┬─────────┘
                 │              │
    ┌────────────▼────┐    ┌───▼────────────┐
    │  Next.js (SSR)  │    │  Static Assets │
    │   Port 3000     │    │   (Frontend)   │
    └────────┬────────┘    └────────────────┘
             │
             │ HTTP/REST API
             │
    ┌────────▼─────────┐
    │  NestJS Backend  │
    │    Port 3001     │
    │                  │
    │  ┌────────────┐  │
    │  │Controllers │  │
    │  └─────┬──────┘  │
    │        │         │
    │  ┌─────▼──────┐  │
    │  │  Services  │  │
    │  └─────┬──────┘  │
    │        │         │
    │  ┌─────▼──────┐  │
    │  │  Prisma    │  │
    │  │   ORM      │  │
    │  └─────┬──────┘  │
    └────────┼─────────┘
             │
    ┌────────▼─────────────────────────┐
    │      DATA LAYER                  │
    │  ┌──────────┐  ┌──────────┐     │
    │  │PostgreSQL│  │  Redis   │     │
    │  │(Primary) │  │ (Cache)  │     │
    │  └──────────┘  └──────────┘     │
    │  ┌──────────┐  ┌──────────┐     │
    │  │Meilisearch│ │  MinIO   │     │
    │  │ (Search) │  │(Storage) │     │
    │  └──────────┘  └──────────┘     │
    └──────────────────────────────────┘
```

## Warstwy Aplikacji

### 1. Warstwa Prezentacji (Frontend)

**Technologia**: Next.js 16 + React 19.2.0

**Odpowiedzialności**:
- Renderowanie interfejsu użytkownika
- Server-Side Rendering (SSR) dla SEO
- Client-Side Routing
- Zarządzanie stanem klienta
- Komunikacja z API backendu

**Główne Komponenty**:
- **Pages/Routes**: Strony publiczne i panel administracyjny
- **Components**: Komponenty React (layout, content, admin)
- **Hooks**: Custom hooks dla logiki biznesowej
- **Stores**: Zustand stores dla stanu globalnego
- **API Client**: Axios z interceptorami JWT

### 2. Warstwa Logiki Biznesowej (Backend)

**Technologia**: NestJS 11 + Node.js 18+

**Odpowiedzialności**:
- Obsługa żądań HTTP
- Walidacja danych wejściowych
- Logika biznesowa
- Autoryzacja i uwierzytelnianie
- Zarządzanie danymi
- WebSocket dla powiadomień real-time

**Główne Komponenty**:
- **Modules**: 14 modułów funkcjonalnych
- **Controllers**: Obsługa endpointów REST API
- **Services**: Logika biznesowa
- **Guards**: Ochrona tras (JWT, RBAC)
- **Decorators**: Metadane dla autoryzacji
- **Gateways**: WebSocket dla real-time

### 3. Warstwa Danych

**Technologie**:
- **PostgreSQL 15**: Główna baza relacyjna
- **Redis 7**: Cache i kolejki
- **Meilisearch**: Full-text search
- **MinIO**: Object storage (S3-compatible)

**Odpowiedzialności**:
- Przechowywanie danych
- Indeksowanie dla wyszukiwania
- Cache dla wydajności
- Przechowywanie plików

## Wzorce Architektoniczne

### 1. Architektura Modułowa

```
Backend Modules Structure:
├── Auth Module           (Autentykacja)
├── Articles Module       (Artykuły)
├── Blog Posts Module     (Blog)
├── Wiki Pages Module     (Wiki z hierarchią)
├── Gallery Items Module  (Galeria)
├── Stories Module        (Historie)
├── Authors Module        (Autorzy)
├── Comments Module       (Komentarze polimorficzne)
├── Ratings Module        (Oceny polimorficzne)
├── Search Module         (Wyszukiwanie)
├── Notifications Module  (Powiadomienia WebSocket)
├── Email Module          (Email queue)
├── Content Versions      (Wersjonowanie)
└── Search Enhanced       (Zaawansowane wyszukiwanie)
```

Każdy moduł zawiera:
- **Controller**: Obsługa HTTP requests
- **Service**: Logika biznesowa
- **DTOs**: Data Transfer Objects
- **Entities/Models**: Definicje Prisma

### 2. Service Layer Pattern

```
Request Flow:
Client → Controller → Service → Prisma → Database
                        ↓
                    Cache/Queue
```

**Zalety**:
- Separacja concerns
- Łatwe testowanie
- Reużywalność logiki
- Czytelny kod

### 3. Repository Pattern (przez Prisma)

Prisma działa jako warstwa abstrakcji nad bazą danych:
- Type-safe queries
- Migracje schema
- Relacje automatyczne
- Zapobieganie SQL injection

### 4. Dependency Injection

NestJS wykorzystuje wbudowany system DI:
```typescript
@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}
}
```

### 5. Guard-Based Authorization

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@Post()
createArticle() { }
```

### 6. DTO Validation Pattern

```typescript
export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  content: string;
}
```

## Komunikacja Między Warstwami

### REST API

**Format**: JSON
**Protokół**: HTTP/HTTPS
**Autentykacja**: JWT Bearer Token

```
Frontend → Backend
  GET /api/articles
  Authorization: Bearer <jwt_token>

Backend → Frontend
  {
    "data": [...],
    "pagination": {...}
  }
```

### WebSocket (Real-time)

**Protokół**: Socket.IO
**Use Cases**: Powiadomienia, live updates

```
Client ← Server (WebSocket)
  event: 'notification'
  data: { type: 'COMMENT', message: '...' }
```

## Bezpieczeństwo

### Warstwy Bezpieczeństwa

1. **Network Level**: Nginx reverse proxy, CORS
2. **Application Level**: JWT, RBAC, rate limiting
3. **Data Level**: Bcrypt hashing, Prisma ORM
4. **Transport Level**: HTTPS (produkcja)

### JWT Flow

```
1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT (15 min) + Refresh Token
   ↓
4. Return tokens to Frontend
   ↓
5. Frontend stores in localStorage
   ↓
6. Include in Authorization header
   ↓
7. Backend validates on protected routes
```

## Skalowalność

### Horizontal Scaling

- **Frontend**: Stateless SSR - łatwe skalowanie
- **Backend**: Stateless API - load balancing
- **Database**: Read replicas, connection pooling
- **Cache**: Redis cluster dla high availability

### Vertical Scaling

- Optymalizacja queries (indexes)
- Cache strategies
- Image optimization
- Code splitting

## Wydajność

### Frontend Optimization
- Next.js Image optimization
- Code splitting
- Lazy loading
- React Query caching

### Backend Optimization
- Redis caching
- Database indexes
- Query optimization
- Bull queues dla async tasks

### Database Optimization
- Indexes na często używanych polach
- Prisma query optimization
- Connection pooling
- Materialized views (future)

## Monitorowanie i Logging

### Backend Logging
- Structured logging
- Error tracking
- Performance metrics

### Frontend Monitoring
- Error boundaries
- Performance tracking
- User analytics

### Infrastructure
- Docker health checks
- Service availability
- Resource usage

## Backup i Recovery

### Database Backup
- Daily automated backups
- Point-in-time recovery
- Backup retention policy

### File Storage
- MinIO replication
- S3 backup strategy

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:3001)
├── Frontend (localhost:3000)
└── PostgreSQL (localhost:5432)
```

### Production (Docker)
```
Docker Compose Stack
├── Nginx (Reverse Proxy)
├── Backend Container
├── Frontend Container
├── PostgreSQL Container
├── Redis Container
├── Meilisearch Container
└── MinIO Container
```

## Przyszłe Usprawnienia

1. **Microservices**: Rozdzielenie na niezależne serwisy
2. **Kubernetes**: Orkiestracja kontenerów
3. **CDN**: Dla static assets
4. **Message Queue**: RabbitMQ/Kafka dla event-driven
5. **Elasticsearch**: Zaawansowane analytics
6. **GraphQL**: Alternatywa dla REST API

## Diagramy

### Component Diagram

```
┌─────────────────────────────────────────┐
│          Frontend (Next.js)             │
│  ┌──────────┐  ┌──────────┐            │
│  │  Pages   │  │Components│            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                   │
│  ┌────▼─────────────▼─────┐            │
│  │    API Client (Axios)  │            │
│  └────────────┬────────────┘            │
└───────────────┼─────────────────────────┘
                │ HTTP/REST
┌───────────────▼─────────────────────────┐
│          Backend (NestJS)               │
│  ┌──────────┐  ┌──────────┐            │
│  │Controllers│  │ Services │            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                   │
│  ┌────▼─────────────▼─────┐            │
│  │    Prisma ORM          │            │
│  └────────────┬────────────┘            │
└───────────────┼─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│           Data Layer                    │
│  PostgreSQL │ Redis │ Meilisearch       │
└─────────────────────────────────────────┘
```

### Deployment Diagram

```
┌────────────────────────────────────────┐
│         Production Server              │
│  ┌──────────────────────────────────┐  │
│  │      Docker Compose              │  │
│  │  ┌────────┐  ┌────────┐         │  │
│  │  │ Nginx  │  │Frontend│         │  │
│  │  └───┬────┘  └───┬────┘         │  │
│  │      │           │               │  │
│  │  ┌───▼───────────▼───┐          │  │
│  │  │     Backend       │          │  │
│  │  └────────┬──────────┘          │  │
│  │           │                      │  │
│  │  ┌────────▼──────────┐          │  │
│  │  │  Data Services    │          │  │
│  │  │  (PG, Redis, etc) │          │  │
│  │  └───────────────────┘          │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## Podsumowanie

Architektura Multimedia Portal została zaprojektowana z myślą o:
- **Modularności**: Łatwe dodawanie nowych funkcji
- **Skalowalności**: Możliwość skalowania w miarę wzrostu
- **Bezpieczeństwie**: Wielowarstwowa ochrona
- **Wydajności**: Optymalizacje na każdym poziomie
- **Utrzymywalności**: Czytelny, testowalny kod

---

**Wersja dokumentu**: 1.0.0
**Data**: 2025-11-07
**Autor**: Analiza automatyczna Claude Code
