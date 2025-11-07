# Multimedia Portal - Dokumentacja Techniczna

## Spis Treści

### 1. Architektura
- [Przegląd Architektury](./architecture/overview.md) - Ogólny przegląd systemu
- [Backend (NestJS)](./architecture/backend.md) - Szczegółowa dokumentacja backendu
- [Frontend (Next.js)](./architecture/frontend.md) - Szczegółowa dokumentacja frontendu
- [Wzorce Projektowe](./architecture/patterns.md) - Zastosowane wzorce architektoniczne

### 2. Baza Danych
- [Schema Bazy Danych](./database/schema.md) - Struktura tabel i modeli
- [Relacje i Związki](./database/relationships.md) - Relacje między encjami
- [Migracje](./database/migrations.md) - Zarządzanie migracjami bazy danych
- [Indeksy i Optymalizacja](./database/optimization.md) - Optymalizacja zapytań

### 3. API
- [Dokumentacja Endpointów](./api/endpoints.md) - Kompletna lista endpointów API
- [Autentykacja i Autoryzacja](./api/authentication.md) - System bezpieczeństwa
- [Formaty Odpowiedzi](./api/responses.md) - Struktura odpowiedzi API
- [Obsługa Błędów](./api/error-handling.md) - Zarządzanie błędami

### 4. Rozwój
- [Przewodnik Konfiguracji](./development/setup.md) - Konfiguracja środowiska deweloperskiego
- [Workflow Deweloperski](./development/workflow.md) - Proces tworzenia kodu
- [Standardy Kodowania](./development/coding-standards.md) - Konwencje i najlepsze praktyki
- [Narzędzia Deweloperskie](./development/tools.md) - Przydatne narzędzia

### 5. Wdrożenie
- [Docker Deployment](./deployment/docker.md) - Wdrożenie za pomocą Dockera
- [Produkcja](./deployment/production.md) - Konfiguracja produkcyjna
- [CI/CD](./deployment/cicd.md) - Continuous Integration/Deployment
- [Monitoring](./deployment/monitoring.md) - Monitorowanie systemu

### 6. Testowanie
- [Testy Backend](./testing/backend.md) - Testowanie aplikacji NestJS
- [Testy Frontend](./testing/frontend.md) - Testowanie aplikacji Next.js
- [Testy E2E](./testing/e2e.md) - Testy end-to-end
- [Testy Wydajnościowe](./testing/performance.md) - Load testing z K6

### 7. Bezpieczeństwo
- [Przegląd Bezpieczeństwa](./security/overview.md) - Funkcje bezpieczeństwa
- [JWT i Sesje](./security/jwt.md) - Zarządzanie tokenami
- [RBAC](./security/rbac.md) - Role-Based Access Control
- [Best Practices](./security/best-practices.md) - Najlepsze praktyki

### 8. Komponenty
- [Moduły Backend](./components/backend.md) - Dokumentacja modułów NestJS
- [Komponenty Frontend](./components/frontend.md) - Dokumentacja komponentów React
- [Hooki](./components/hooks.md) - Custom React Hooks
- [Stores](./components/stores.md) - Zustand State Management

## Szybki Start

### Wymagania Systemowe
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (opcjonalnie)

### Instalacja Lokalna

```bash
# Klonowanie repozytorium
git clone <repository-url>
cd multimedia-portal

# Konfiguracja zmiennych środowiskowych
cp .env.example .env
# Edytuj .env i ustaw odpowiednie wartości

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend (w nowym terminalu)
cd frontend
npm install
npm run dev
```

### Instalacja Docker

```bash
# Uruchom cały stack
docker-compose up -d

# Sprawdź logi
docker-compose logs -f

# Zatrzymaj stack
docker-compose down
```

## Stack Technologiczny

### Backend
- **Framework**: NestJS 11.0.1
- **Runtime**: Node.js 18+
- **ORM**: Prisma 6.19.0
- **Baza Danych**: PostgreSQL 15
- **Cache**: Redis 7
- **Search**: Meilisearch
- **Storage**: MinIO (S3-compatible)
- **WebSocket**: Socket.IO

### Frontend
- **Framework**: Next.js 16
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Editor**: Tiptap
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Testing**: Jest, Playwright, K6

## Typy Treści

Portal obsługuje 5 typów treści:
1. **Articles** - Artykuły informacyjne
2. **Blog Posts** - Wpisy blogowe
3. **Wiki Pages** - Strony wiki z hierarchią
4. **Gallery Items** - Elementy galerii (zdjęcia/wideo)
5. **Stories** - Historie i opowiadania

## Funkcje Cross-Content

- **Komentarze** - System komentarzy polimorficznych dla wszystkich typów treści
- **Oceny** - System ocen 1-5 gwiazdek
- **Kategorie i Tagi** - Wspólne kategorie i tagi dla wszystkich treści
- **Wersjonowanie** - Historia zmian dla treści
- **Wyszukiwanie** - Full-text search z Meilisearch
- **Powiadomienia** - Real-time notifications via WebSocket

## Role Użytkowników

- **USER** - Użytkownik zwykły (może komentować, oceniać)
- **MODERATOR** - Moderator (może tworzyć/edytować treści)
- **ADMIN** - Administrator (pełny dostęp)

## Linki Pomocnicze

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

## Wsparcie i Kontakt

Dla pytań technicznych, zgłoszeń błędów lub propozycji funkcji, prosimy o utworzenie issue w repozytorium GitHub.

---

**Ostatnia aktualizacja**: 2025-11-07
**Wersja**: 1.0.0
