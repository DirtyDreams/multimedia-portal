# Production Deployment Guide

This guide covers deploying the Multimedia Portal to a production VPS (Virtual Private Server) using Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Domain Configuration](#domain-configuration)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Application Deployment](#application-deployment)
- [Monitoring Setup](#monitoring-setup)
- [Backup Configuration](#backup-configuration)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 22.04 LTS or later
- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: 2+ cores recommended
- **Storage**: Minimum 50GB SSD
- **Network**: Static IP address

### Local Requirements

- Domain name with DNS access
- SSH key pair
- Git installed locally
- Basic Linux/Docker knowledge

## Server Setup

### 1. Initial Server Configuration

```bash
# SSH into your server
ssh root@your-server-ip

# Update system packages
apt update && apt upgrade -y

# Set hostname
hostnamectl set-hostname multimedia-portal

# Configure timezone
timedatectl set-timezone UTC
```

### 2. Create Non-Root User

```bash
# Create user
adduser deploy
usermod -aG sudo deploy

# Setup SSH for new user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user
su - deploy
```

### 3. Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 4. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
```

### 5. Security Hardening

```bash
# Disable root login via SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (use SSH keys only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart sshd

# Install fail2ban for brute force protection
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Domain Configuration

### 1. DNS Records

Configure the following DNS records for your domain:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | your-server-ip | 3600 |
| A | www | your-server-ip | 3600 |
| A | api | your-server-ip | 3600 |
| A | minio | your-server-ip | 3600 |
| A | grafana | your-server-ip | 3600 |
| CNAME | console | minio.your-domain.com | 3600 |

### 2. Verify DNS Propagation

```bash
# Check DNS resolution
dig your-domain.com
dig api.your-domain.com

# Or use online tools
# https://dnschecker.org
```

## Application Deployment

### 1. Clone Repository

```bash
# Clone repository
cd ~
git clone https://github.com/DirtyDreams/multimedia-portal.git
cd multimedia-portal
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production

# IMPORTANT: Update these critical values:
# - DOMAIN
# - DB_PASSWORD
# - JWT_SECRET
# - REDIS_PASSWORD
# - MINIO_ROOT_USER
# - MINIO_ROOT_PASSWORD
# - MEILI_API_KEY
# - HASH_SALT
# - GRAFANA_ADMIN_PASSWORD
# - SSL_EMAIL
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 64

# Generate Redis password
openssl rand -base64 32

# Generate Meilisearch master key
openssl rand -base64 32

# Generate hash salt
openssl rand -base64 32
```

### 4. Create Required Directories

```bash
# Create directory structure
mkdir -p docker/nginx/conf.d
mkdir -p docker/nginx/ssl
mkdir -p docker/prometheus
mkdir -p docker/grafana/dashboards
mkdir -p docker/grafana/datasources
mkdir -p docker/postgres
mkdir -p docker/backup
mkdir -p logs/{nginx,backend,postgres,redis}
```

## SSL Certificate Setup

### 1. Initial Nginx Configuration (HTTP only)

Create `docker/nginx/nginx.prod.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Basic settings
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # HTTP server (for Let's Encrypt)
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }
}
```

### 2. Obtain SSL Certificate

```bash
# Start services (without SSL first)
docker-compose -f docker-compose.prod.yml up -d nginx certbot

# Request certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com \
  -d api.your-domain.com \
  -d minio.your-domain.com \
  -d grafana.your-domain.com
```

### 3. Configure Nginx with SSL

Update `docker/nginx/nginx.prod.conf` to include SSL configuration (see example in repository).

### 4. Restart Nginx

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## Application Deployment (Continued)

### 5. Build and Start Services

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Database Setup

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# (Optional) Seed initial data
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### 7. Verify Deployment

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# Check backend health
curl https://api.your-domain.com/api/v1/health

# Check frontend
curl https://your-domain.com

# View all logs
docker-compose -f docker-compose.prod.yml logs
```

## Monitoring Setup

### 1. Access Grafana

Navigate to `https://grafana.your-domain.com` and login with:
- Username: `admin`
- Password: (from `GRAFANA_ADMIN_PASSWORD` in .env.production)

### 2. Configure Dashboards

Grafana is pre-configured with:
- System metrics dashboard
- Application performance monitoring
- Database statistics
- API request metrics

### 3. Set Up Alerts

Configure alerts for:
- High CPU/Memory usage
- Database connection issues
- API error rates
- Disk space warnings

## Backup Configuration

### 1. Database Backups

Create `docker/backup/backup.sh`:

```bash
#!/bin/sh
# Automated PostgreSQL backup script

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -h postgres -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Upload to S3 (optional)
if [ -n "$S3_BUCKET" ]; then
    aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/backups/
fi

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE"
```

### 2. Configure Cron

```bash
# Edit crontab for backup container
# Runs daily at 2 AM
0 2 * * * /usr/local/bin/backup.sh >> /backups/backup.log 2>&1
```

### 3. Test Backup

```bash
# Manually trigger backup
docker-compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup.sh

# Verify backup file
docker-compose -f docker-compose.prod.yml exec backup ls -lh /backups
```

## Maintenance

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/multimedia-portal

# Add configuration:
/home/deploy/multimedia-portal/logs/*/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```

### SSL Certificate Renewal

Certificates auto-renew via certbot container. Verify renewal:

```bash
# Test renewal
docker-compose -f docker-compose.prod.yml run --rm certbot renew --dry-run

# Check certificate expiration
docker-compose -f docker-compose.prod.yml exec nginx openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -noout -dates
```

## Troubleshooting

### Service Won't Start

```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U multimedia_user -d multimedia_db

# Check connections
docker-compose -f docker-compose.prod.yml exec postgres psql -U multimedia_user -d multimedia_db -c "SELECT * FROM pg_stat_activity;"
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart services to clear memory
docker-compose -f docker-compose.prod.yml restart
```

### SSL Certificate Issues

```bash
# Check certificate status
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# View certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Performance Optimization

### 1. Enable HTTP/2

Already configured in nginx.conf

### 2. Configure Gzip Compression

Already configured in nginx.conf

### 3. Enable Redis Persistence

Already configured in docker-compose.prod.yml

### 4. Database Performance Tuning

Edit `docker/postgres/postgresql.conf`:

```conf
# Performance tuning
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

## Security Best Practices

1. **Keep secrets secure** - Never commit .env.production
2. **Regular updates** - Apply security patches weekly
3. **Monitor logs** - Check for suspicious activity
4. **Backup regularly** - Test restore procedures
5. **Use strong passwords** - Minimum 32 characters for secrets
6. **Enable 2FA** - For critical services (Grafana, server access)
7. **Limit access** - Use firewall rules and VPN when possible

## Support

For deployment issues:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- GitHub Issues: https://github.com/DirtyDreams/multimedia-portal/issues
- Documentation: https://github.com/DirtyDreams/multimedia-portal/wiki
