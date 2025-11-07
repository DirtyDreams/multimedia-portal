# Wdrożenie z Docker

## Wprowadzenie

Multimedia Portal jest zaprojektowany do łatwego wdrożenia z wykorzystaniem Docker i Docker Compose. Ta dokumentacja opisuje proces wdrożenia na środowiska deweloperskie, staging i produkcyjne.

## Architektura Docker

### Stack Serwisów

```
docker-compose.yml
├── postgres        # PostgreSQL 15 (Primary database)
├── redis           # Redis 7 (Cache & Queue)
├── meilisearch     # Meilisearch (Full-text search)
├── minio           # MinIO (S3-compatible storage)
├── backend         # NestJS application
├── frontend        # Next.js application
└── nginx           # Reverse proxy
```

### Network Architecture

```
┌─────────────────────────────────────────┐
│          Docker Network                 │
│                                          │
│  ┌────────┐                             │
│  │ Nginx  │ :80, :443                   │
│  └───┬────┘                             │
│      │                                   │
│  ┌───▼────────┐   ┌─────────────┐      │
│  │  Frontend  │   │   Backend   │      │
│  │   :3000    │   │    :3001    │      │
│  └────────────┘   └──────┬──────┘      │
│                           │              │
│  ┌────────────────────────▼────┐        │
│  │     Data Layer              │        │
│  │  ┌──────────┐  ┌─────────┐ │        │
│  │  │PostgreSQL│  │  Redis  │ │        │
│  │  │  :5432   │  │  :6379  │ │        │
│  │  └──────────┘  └─────────┘ │        │
│  │  ┌──────────┐  ┌─────────┐ │        │
│  │  │Meilisearch│ │  MinIO  │ │        │
│  │  │  :7700   │  │  :9000  │ │        │
│  │  └──────────┘  └─────────┘ │        │
│  └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

## Konfiguracja Produkcyjna

### 1. Przygotowanie Serwera

#### Wymagania Minimalne
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 20 GB SSD
- **OS**: Ubuntu 22.04 LTS (zalecane)

#### Wymagania Zalecane
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS

#### Instalacja Docker na Ubuntu

```bash
# Update pakietów
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dodaj użytkownika do grupy docker
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin

# Weryfikacja
docker --version
docker compose version
```

### 2. Konfiguracja Environment Variables

**`.env.production`**:
```env
# =============================================
# DATABASE CONFIGURATION
# =============================================
POSTGRES_USER=multimedia_prod_user
POSTGRES_PASSWORD=<STRONG_PASSWORD_HERE>
POSTGRES_DB=multimedia_prod
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"

# =============================================
# JWT CONFIGURATION
# =============================================
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<GENERATE_STRONG_REFRESH_SECRET>
JWT_REFRESH_EXPIRATION=7d

# =============================================
# REDIS CONFIGURATION
# =============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>

# =============================================
# MEILISEARCH CONFIGURATION
# =============================================
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=<GENERATE_MASTER_KEY>

# =============================================
# MINIO CONFIGURATION
# =============================================
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ROOT_USER=<MINIO_ACCESS_KEY>
MINIO_ROOT_PASSWORD=<MINIO_SECRET_KEY>
MINIO_USE_SSL=true
MINIO_BUCKET_NAME=multimedia-portal-prod

# =============================================
# EMAIL CONFIGURATION
# =============================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<SENDGRID_API_KEY>
SMTP_FROM=noreply@your-domain.com

# =============================================
# APPLICATION CONFIGURATION
# =============================================
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# =============================================
# NGINX/SSL CONFIGURATION
# =============================================
DOMAIN=your-domain.com
SSL_EMAIL=admin@your-domain.com

# =============================================
# LOGGING
# =============================================
LOG_LEVEL=info
```

**Generowanie Secrets**:
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using openssl
openssl rand -hex 64
```

### 3. Production Docker Compose

**`docker-compose.prod.yml`**:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: multimedia-postgres-prod
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: multimedia-redis-prod
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Meilisearch
  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: multimedia-meilisearch-prod
    restart: always
    environment:
      - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
      - MEILI_ENV=production
    volumes:
      - meilisearch_data:/meili_data
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:7700/health']
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: multimedia-minio-prod
    restart: always
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 30s
      timeout: 20s
      retries: 3

  # Backend (NestJS)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        - NODE_ENV=production
    container_name: multimedia-backend-prod
    restart: always
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PORT=${REDIS_PORT}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - MEILI_HOST=${MEILI_HOST}
      - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
      - NODE_ENV=production
      - PORT=${BACKEND_PORT}
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - NEXT_PUBLIC_API_URL=${BACKEND_URL}
        - NODE_ENV=production
    container_name: multimedia-frontend-prod
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=${BACKEND_URL}
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000']
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: multimedia-nginx-prod
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - multimedia-network
    healthcheck:
      test: ['CMD', 'nginx', '-t']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  meilisearch_data:
    driver: local
  minio_data:
    driver: local
  nginx_logs:
    driver: local

networks:
  multimedia-network:
    driver: bridge
```

### 4. Production Dockerfiles

#### Backend Dockerfile.prod

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

USER nestjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main"]
```

#### Frontend Dockerfile.prod

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NODE_ENV=production

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=$NODE_ENV

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]
```

### 5. Nginx Configuration

**`nginx/nginx.prod.conf`**:
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main server block
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API endpoints
        location /api {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket for notifications
        location /socket.io {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth {
            limit_req zone=login_limit burst=5 nodelay;

            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend:3000;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Deployment Procedures

### Initial Deployment

```bash
# 1. Clone repository na serwerze
git clone <repository-url> /var/www/multimedia-portal
cd /var/www/multimedia-portal

# 2. Setup environment
cp .env.example .env.production
nano .env.production  # Edit with production values

# 3. Build i uruchom
docker compose -f docker-compose.prod.yml up -d --build

# 4. Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. (Optional) Seed initial data
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed

# 6. Verify deployment
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```

### SSL Configuration (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx

# Setup auto-renewal
sudo crontab -e
# Add line:
0 0 * * * certbot renew --quiet && docker compose -f /var/www/multimedia-portal/docker-compose.prod.yml restart nginx
```

### Updates and Rollbacks

#### Update Application

```bash
# 1. Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and deploy
docker compose -f docker-compose.prod.yml up -d --build

# 4. Run migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Verify
docker compose -f docker-compose.prod.yml ps
```

#### Rollback

```bash
# 1. Revert to previous commit
git revert HEAD
# Or
git checkout <previous-commit-hash>

# 2. Rebuild
docker compose -f docker-compose.prod.yml up -d --build

# 3. Restore database if needed
docker compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < backup_file.sql
```

## Monitoring

### Health Checks

```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# Check specific service health
docker compose -f docker-compose.prod.yml exec backend curl http://localhost:3001/health

# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Service-specific logs
docker compose -f docker-compose.prod.yml logs -f backend
```

### Resource Monitoring

```bash
# Docker stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

## Backup & Restore

### Database Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/multimedia-portal"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup MinIO
docker compose -f docker-compose.prod.yml exec -T minio mc mirror /data $BACKUP_DIR/minio_$DATE/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Cron setup**:
```bash
# Daily backup at 2 AM
0 2 * * * /var/www/multimedia-portal/backup.sh
```

### Restore

```bash
# Restore PostgreSQL
gunzip < backup_file.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB

# Restore MinIO
docker compose -f docker-compose.prod.yml exec -T minio mc mirror $BACKUP_DIR/minio_YYYYMMDD/ /data
```

## Security Best Practices

1. **Use strong passwords** for all services
2. **Enable SSL/TLS** for all connections
3. **Regular updates** of Docker images
4. **Firewall configuration** (UFW):
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
5. **Fail2ban** for brute-force protection
6. **Regular backups**
7. **Monitor logs** for suspicious activity

## Performance Tuning

### PostgreSQL

```sql
-- Adjust settings in postgresql.conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Redis

```bash
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Troubleshooting

### Service não está respondendo

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs service_name

# Restart service
docker compose -f docker-compose.prod.yml restart service_name

# Full restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Database connection issues

```bash
# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

# Check network
docker compose -f docker-compose.prod.yml exec backend ping postgres
```

## Podsumowanie

Docker deployment dla Multimedia Portal zapewnia:
- ✅ Izolację serwisów
- ✅ Łatwe skalowanie
- ✅ Automatyczne restarty
- ✅ Health checks
- ✅ Resource limits
- ✅ Easy updates
- ✅ Backup procedures

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
