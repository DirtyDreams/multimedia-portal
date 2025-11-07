# Przewodnik Konfiguracji Deweloperskiej

## Wymagania Systemowe

### Wymagane

- **Node.js**: 18.x lub nowszy
- **npm**: 9.x lub nowszy
- **PostgreSQL**: 15.x lub nowszy
- **Git**: 2.x lub nowszy

### Opcjonalne (dla Docker)

- **Docker**: 20.x lub nowszy
- **Docker Compose**: 2.x lub nowszy

### Zalecane Narzędzia

- **VS Code** z rozszerzeniami:
  - Prisma
  - ESLint
  - Prettier
  - TypeScript
  - Docker
- **Postman** lub **Insomnia** - testowanie API
- **DBeaver** lub **pgAdmin** - zarządzanie PostgreSQL

## Instalacja Lokalna

### 1. Klonowanie Repozytorium

```bash
# Klonuj repozytorium
git clone <repository-url>
cd multimedia-portal

# Sprawdź strukturę
ls -la
```

### 2. Konfiguracja Zmiennych Środowiskowych

#### Backend

```bash
# Skopiuj przykładowy plik .env
cd backend
cp .env.example .env

# Edytuj plik .env
nano .env
```

**Backend `.env`**:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multimedia_db?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=multimedia_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_me_in_production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_me
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Meilisearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=multimedia-portal

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@multimedia-portal.com

# Application
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

#### Frontend

```bash
cd ../frontend
cp .env.example .env
nano .env
```

**Frontend `.env.local`**:
```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### 3. Instalacja PostgreSQL

#### macOS (Homebrew)
```bash
# Zainstaluj PostgreSQL
brew install postgresql@15

# Uruchom serwis
brew services start postgresql@15

# Utwórz bazę danych
createdb multimedia_db
```

#### Ubuntu/Debian
```bash
# Dodaj repository PostgreSQL
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Zainstaluj
sudo apt update
sudo apt install postgresql-15

# Uruchom
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Utwórz użytkownika i bazę
sudo -u postgres psql
postgres=# CREATE USER postgres WITH PASSWORD 'postgres';
postgres=# CREATE DATABASE multimedia_db OWNER postgres;
postgres=# \q
```

#### Windows
1. Pobierz instalator z https://www.postgresql.org/download/windows/
2. Uruchom instalator
3. Ustaw hasło dla użytkownika `postgres`
4. Zapamiętaj port (domyślnie 5432)
5. Utwórz bazę `multimedia_db` przez pgAdmin

### 4. Instalacja Redis (opcjonalnie lokalnie)

#### macOS
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Windows
1. Pobierz z https://github.com/microsoftarchive/redis/releases
2. Uruchom `redis-server.exe`

**Lub użyj Docker**:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. Instalacja Backend

```bash
cd backend

# Zainstaluj zależności
npm install

# Wygeneruj Prisma Client
npx prisma generate

# Uruchom migracje
npx prisma migrate dev

# Seed bazy danych (opcjonalnie)
npx prisma db seed

# Uruchom serwer deweloperski
npm run start:dev
```

**Sprawdzenie**:
```bash
# Test API
curl http://localhost:3001/health
# Oczekiwany output: {"status":"ok","timestamp":"..."}
```

### 6. Instalacja Frontend

```bash
cd ../frontend

# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```

**Sprawdzenie**:
Otwórz przeglądarkę: http://localhost:3000

### 7. Weryfikacja Instalacji

#### Backend
```bash
# Sprawdź czy serwer działa
curl http://localhost:3001/api/articles

# Sprawdź Prisma
cd backend
npx prisma studio
```

#### Frontend
```bash
# Otwórz w przeglądarce
open http://localhost:3000

# Sprawdź czy API jest dostępne z frontendu
# W konsoli przeglądarki:
fetch('http://localhost:3001/api/articles').then(r => r.json()).then(console.log)
```

## Instalacja Docker

### 1. Instalacja Docker

#### macOS
```bash
# Pobierz Docker Desktop
# https://www.docker.com/products/docker-desktop

# Lub przez Homebrew
brew install --cask docker
```

#### Ubuntu/Debian
```bash
# Zainstaluj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dodaj użytkownika do grupy docker
sudo usermod -aG docker $USER
newgrp docker

# Zainstaluj Docker Compose
sudo apt install docker-compose-plugin
```

#### Windows
1. Pobierz Docker Desktop z https://www.docker.com/products/docker-desktop
2. Uruchom instalator
3. Włącz WSL 2

### 2. Konfiguracja Environment

```bash
# Skopiuj plik .env
cp .env.example .env.docker
nano .env.docker
```

**`.env.docker`**:
```env
# Database
POSTGRES_USER=multimedia_user
POSTGRES_PASSWORD=multimedia_password
POSTGRES_DB=multimedia_db
DATABASE_URL="postgresql://multimedia_user:multimedia_password@postgres:5432/multimedia_db?schema=public"

# JWT
JWT_SECRET=your_super_secret_jwt_key_docker
JWT_REFRESH_SECRET=your_refresh_secret_docker

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Meilisearch
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=masterKey

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Application
NODE_ENV=development
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

### 3. Uruchomienie Stacku

```bash
# Build i uruchom wszystkie serwisy
docker-compose up -d

# Sprawdź status
docker-compose ps

# Wyświetl logi
docker-compose logs -f

# Tylko backend
docker-compose logs -f backend

# Tylko frontend
docker-compose logs -f frontend
```

**Oczekiwany output**:
```
NAME                    STATUS              PORTS
multimedia-postgres     Up                  5432->5432
multimedia-redis        Up                  6379->6379
multimedia-meilisearch  Up                  7700->7700
multimedia-minio        Up                  9000->9000, 9001->9001
multimedia-backend      Up                  3001->3001
multimedia-frontend     Up                  3000->3000
multimedia-nginx        Up                  80->80
```

### 4. Inicjalizacja Bazy (Docker)

```bash
# Wejdź do kontenera backend
docker-compose exec backend sh

# Uruchom migracje
npx prisma migrate deploy

# Seed (opcjonalnie)
npx prisma db seed

# Wyjdź
exit
```

### 5. Dostęp do Serwisów

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Meilisearch**: http://localhost:7700
- **MinIO Console**: http://localhost:9001
- **Prisma Studio**: `docker-compose exec backend npx prisma studio`

### 6. Zarządzanie Docker

```bash
# Zatrzymaj wszystkie serwisy
docker-compose down

# Zatrzymaj i usuń volumes (UWAGA: usuwa dane!)
docker-compose down -v

# Rebuild po zmianach w Dockerfile
docker-compose up -d --build

# Restart pojedynczego serwisu
docker-compose restart backend

# Wyświetl logi
docker-compose logs -f backend frontend

# Wejdź do kontenera
docker-compose exec backend sh
docker-compose exec frontend sh

# Sprawdź zużycie zasobów
docker stats
```

## Migracje Bazy Danych

### Tworzenie Nowej Migracji

```bash
cd backend

# Edytuj schema.prisma
nano prisma/schema.prisma

# Wygeneruj migrację
npx prisma migrate dev --name add_user_preferences

# Zastosuj migrację
npx prisma migrate dev

# Wygeneruj Prisma Client
npx prisma generate
```

### Reset Bazy (Development Only!)

```bash
# UWAGA: Usuwa wszystkie dane!
npx prisma migrate reset

# Lub tylko rollback ostatniej migracji
npx prisma migrate dev --create-only
# Edytuj migrację w prisma/migrations/
npx prisma migrate dev
```

### Seed Bazy

```bash
# Uruchom seed
npx prisma db seed

# Lub przez npm
npm run seed
```

**`prisma/seed.ts`**:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Utwórz admin usera
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Utwórz moderatora
  const modPassword = await bcrypt.hash('mod123', 10);

  const moderator = await prisma.user.upsert({
    where: { email: 'mod@example.com' },
    update: {},
    create: {
      email: 'mod@example.com',
      username: 'moderator',
      password: modPassword,
      name: 'Moderator User',
      role: 'MODERATOR',
      emailVerified: true,
    },
  });

  console.log('Created moderator:', moderator.email);

  // Utwórz kategorie
  const techCategory = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology articles and news',
      color: '#3B82F6',
    },
  });

  console.log('Created category:', techCategory.name);

  // Utwórz przykładowy artykuł
  const article = await prisma.article.create({
    data: {
      title: 'Getting Started with Multimedia Portal',
      slug: 'getting-started',
      excerpt: 'Learn how to use the Multimedia Portal',
      content: 'This is an example article...',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      userId: admin.id,
      categories: {
        create: {
          category: {
            connect: { id: techCategory.id },
          },
        },
      },
    },
  });

  console.log('Created article:', article.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Testowanie

### Backend Tests

```bash
cd backend

# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Specific test file
npm test -- articles.service.spec.ts
```

### Frontend Tests

```bash
cd frontend

# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E with Playwright
npm run test:e2e

# Open Playwright UI
npm run test:e2e:ui
```

## Linting i Formatowanie

### Backend

```bash
cd backend

# ESLint
npm run lint

# Fix automatycznie
npm run lint:fix

# Prettier
npm run format

# Check formatting
npm run format:check
```

### Frontend

```bash
cd frontend

# ESLint
npm run lint

# Next.js lint
npm run lint:next

# Prettier
npm run format
```

## Debugging

### VS Code Launch Configuration

**`.vscode/launch.json`**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "restart": true
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend",
      "sourceMapPathOverrides": {
        "webpack:///./*": "${webRoot}/*"
      }
    }
  ]
}
```

### Backend Debugging

```bash
# Start w trybie debug
npm run start:debug

# Attach debugger w VS Code (F5)
```

### Frontend Debugging

1. Uruchom `npm run dev`
2. Otwórz Chrome DevTools (F12)
3. Lub użyj VS Code debugger (F5)

## Częste Problemy i Rozwiązania

### Problem: "Port already in use"

```bash
# Znajdź proces na porcie
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Kill proces
kill -9 <PID>

# Lub zmień port w .env
PORT=3002
```

### Problem: "Cannot connect to PostgreSQL"

```bash
# Sprawdź czy PostgreSQL działa
pg_isready

# Sprawdź połączenie
psql -h localhost -U postgres -d multimedia_db

# Reset hasła PostgreSQL (macOS)
psql postgres
postgres=# ALTER USER postgres PASSWORD 'newpassword';
```

### Problem: "Prisma Client not generated"

```bash
# Wygeneruj ponownie
npx prisma generate

# Usuń node_modules i zainstaluj ponownie
rm -rf node_modules
npm install
npx prisma generate
```

### Problem: "Module not found" (Frontend)

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Problem: Docker "Cannot connect to database"

```bash
# Sprawdź logi
docker-compose logs postgres

# Sprawdź network
docker-compose exec backend ping postgres

# Restart postgres
docker-compose restart postgres

# Rebuild
docker-compose down
docker-compose up -d --build
```

## Narzędzia Deweloperskie

### Prisma Studio

```bash
# Uruchom Prisma Studio
npx prisma studio

# Otwórz w przeglądarce: http://localhost:5555
```

### API Testing

**Postman Collection** (przykład):
```json
{
  "info": {
    "name": "Multimedia Portal API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {
              "raw": "http://localhost:3001/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

### Database GUI

- **DBeaver**: https://dbeaver.io/download/
- **pgAdmin**: https://www.pgadmin.org/download/
- **TablePlus**: https://tableplus.com/

**Connection Settings**:
- Host: localhost
- Port: 5432
- Database: multimedia_db
- Username: postgres
- Password: postgres

## Best Practices

1. **Git Workflow**:
   - Zawsze pracuj na feature branches
   - Commit często z descriptive messages
   - Pull request przed merge do main

2. **Environment Variables**:
   - Nigdy nie commituj `.env` do repo
   - Używaj `.env.example` jako template
   - Różne wartości dla dev/staging/prod

3. **Database**:
   - Zawsze twórz migracje dla zmian schema
   - Testuj migracje przed production
   - Backup przed migracjami na production

4. **Testing**:
   - Pisz testy dla nowych features
   - Run tests before commit
   - Utrzymuj coverage >80%

5. **Code Quality**:
   - Run linter przed commit
   - Follow TypeScript strict mode
   - Review własny kod przed PR

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
