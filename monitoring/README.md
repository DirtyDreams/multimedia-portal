# Monitoring Setup Guide

Comprehensive monitoring for Multimedia Portal using Prometheus, Grafana, and various exporters.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Components](#components)
5. [Metrics Exposed](#metrics-exposed)
6. [Dashboards](#dashboards)
7. [Alerts](#alerts)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The monitoring stack provides:

- **Metrics Collection**: Prometheus scrapes metrics from all services
- **Visualization**: Grafana dashboards for real-time monitoring
- **Alerting**: Alertmanager for alert routing and notifications
- **System Metrics**: Node Exporter for system-level metrics
- **Container Metrics**: cAdvisor for Docker container metrics
- **Database Metrics**: Postgres Exporter and Redis Exporter
- **Application Metrics**: Custom business metrics from NestJS

### Stack Components

- **Prometheus** (v2.x): Time-series database and metrics collection
- **Grafana** (v10.x): Visualization and dashboards
- **Alertmanager** (v0.26.x): Alert routing and notifications
- **Node Exporter** (v1.7.x): System metrics
- **cAdvisor** (latest): Container metrics
- **Postgres Exporter** (v0.15.x): PostgreSQL metrics
- **Redis Exporter** (v1.55.x): Redis metrics

---

## Quick Start

### 1. Start Monitoring Stack

```bash
# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### 2. Access Services

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Node Exporter**: http://localhost:9100/metrics
- **cAdvisor**: http://localhost:8081
- **Application Metrics**: http://localhost:4000/metrics

### 3. Configure Alerts

Edit alert rules in `monitoring/prometheus/alerts.yml` and reload Prometheus:

```bash
curl -X POST http://localhost:9090/-/reload
```

### 4. Import Grafana Dashboards

1. Navigate to http://localhost:3001
2. Login with admin/admin (change password!)
3. Go to Dashboards → Import
4. Import recommended dashboards (see [Dashboards](#dashboards))

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│                                                                  │
│  NestJS Backend (/metrics endpoint)                             │
│  └─> Prometheus Metrics (HTTP requests, DB queries, etc.)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPORTERS LAYER                             │
│                                                                  │
│  ├─ Node Exporter       (system metrics)                        │
│  ├─ cAdvisor            (container metrics)                     │
│  ├─ Postgres Exporter   (database metrics)                      │
│  └─ Redis Exporter      (cache metrics)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROMETHEUS (Metrics DB)                       │
│                                                                  │
│  ├─ Scrape metrics every 15s                                    │
│  ├─ Store in time-series database                               │
│  ├─ Evaluate alert rules                                        │
│  └─> Send alerts to Alertmanager                                │
└────────────────────────┬───────────────┬────────────────────────┘
                         │               │
                         ▼               ▼
┌────────────────────────────┐  ┌──────────────────────────────┐
│       GRAFANA              │  │      ALERTMANAGER            │
│  (Visualization)           │  │  (Alert Routing)             │
│                            │  │                              │
│  ├─ Dashboards             │  │  ├─ Group alerts            │
│  ├─ Panels                 │  │  ├─> Email notifications    │
│  └─ Queries                │  │  └─> Webhook notifications  │
└────────────────────────────┘  └──────────────────────────────┘
```

---

## Components

### Prometheus

**Purpose**: Metrics collection and storage

**Configuration**: `monitoring/prometheus/prometheus.yml`

**Key Features**:
- 15-second scrape interval
- 30-day data retention
- Alert rule evaluation
- Service discovery

**Endpoints Scraped**:
- `backend:4000/metrics` - Application metrics
- `postgres-exporter:9187` - PostgreSQL metrics
- `redis-exporter:9121` - Redis metrics
- `node-exporter:9100` - System metrics
- `cadvisor:8080` - Container metrics

### Grafana

**Purpose**: Visualization and dashboards

**Configuration**: Auto-provisioned datasources and dashboards

**Default Credentials**:
- Username: `admin`
- Password: `admin` (change on first login!)

**Features**:
- Pre-configured Prometheus datasource
- Dashboard auto-import
- Alert visualization
- Query builder

### Alertmanager

**Purpose**: Alert routing and notifications

**Configuration**: `monitoring/alertmanager/config.yml`

**Features**:
- Email notifications
- Webhook support
- Alert grouping
- Inhibition rules

### Node Exporter

**Purpose**: System-level metrics

**Metrics Provided**:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Filesystem usage

### cAdvisor

**Purpose**: Container metrics

**Metrics Provided**:
- Container CPU usage
- Container memory usage
- Container network I/O
- Container filesystem usage

### Postgres Exporter

**Purpose**: PostgreSQL metrics

**Metrics Provided**:
- Active connections
- Query performance
- Table statistics
- Replication status

### Redis Exporter

**Purpose**: Redis cache metrics

**Metrics Provided**:
- Memory usage
- Cache hit/miss ratio
- Key statistics
- Command statistics

---

## Metrics Exposed

### Application Metrics (/metrics)

#### HTTP Metrics

```promql
# Total HTTP requests
http_requests_total{method="GET", route="/api/v1/articles", status="200"}

# Request duration histogram
http_request_duration_seconds{method="GET", route="/api/v1/articles", status="200"}
```

#### Database Metrics

```promql
# Total database queries
db_queries_total{operation="SELECT", table="articles"}

# Query duration histogram
db_query_duration_seconds{operation="SELECT", table="articles"}
```

#### Cache Metrics

```promql
# Cache hit/miss
cache_requests_total{operation="get", result="hit"}
cache_requests_total{operation="get", result="miss"}

# Cache size
cache_size
```

#### Business Metrics

```promql
# Content views
content_views_total{content_type="article"}

# User registrations
user_registrations_total

# Comments created
comments_created_total{content_type="article"}

# Searches
searches_total
zero_result_searches_total
```

#### Authentication Metrics

```promql
# Auth attempts
auth_attempts_total{result="success"}
auth_attempts_total{result="failure"}

# Token refreshes
token_refreshes_total{result="success"}
```

### Example Queries

#### Request Rate (per minute)

```promql
rate(http_requests_total[5m]) * 60
```

#### Error Rate

```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

#### 95th Percentile Response Time

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### Database Connection Count

```promql
pg_stat_database_numbackends
```

#### Cache Hit Rate

```promql
rate(cache_requests_total{result="hit"}[5m]) /
(rate(cache_requests_total{result="hit"}[5m]) + rate(cache_requests_total{result="miss"}[5m]))
```

---

## Dashboards

### Recommended Pre-built Dashboards

Import these dashboards from Grafana.com:

#### 1. Node Exporter Full (ID: 1860)
- CPU, Memory, Disk, Network
- System-level metrics
- Import: Dashboard → Import → 1860

#### 2. Docker Container Metrics (ID: 193)
- Container CPU, Memory
- Network and Disk I/O
- Import: Dashboard → Import → 193

#### 3. PostgreSQL Database (ID: 9628)
- Database connections
- Query performance
- Table statistics
- Import: Dashboard → Import → 9628

#### 4. Redis Dashboard (ID: 11835)
- Memory usage
- Cache hit rate
- Commands per second
- Import: Dashboard → Import → 11835

### Custom Application Dashboard

Create a new dashboard with these panels:

#### Panel 1: Request Rate
```promql
rate(http_requests_total[5m]) * 60
```

#### Panel 2: Error Rate %
```promql
100 * (
  rate(http_requests_total{status=~"5.."}[5m]) /
  rate(http_requests_total[5m])
)
```

#### Panel 3: Response Time (p95)
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### Panel 4: Active Users (24h)
```promql
count(count_over_time(content_views_total[24h]))
```

#### Panel 5: Content Views by Type
```promql
sum(rate(content_views_total[5m])) by (content_type)
```

---

## Alerts

### Configured Alert Rules

See `monitoring/prometheus/alerts.yml` for all rules.

#### Critical Alerts

1. **BackendDown**: Backend service unreachable for >1 minute
2. **PostgreSQLDown**: Database unreachable for >1 minute
3. **RedisDown**: Cache unreachable for >1 minute
4. **OutOfMemory**: Available memory <10%

#### Warning Alerts

1. **HighErrorRate**: 5xx error rate >5% for 5 minutes
2. **HighResponseTime**: p95 response time >1s for 5 minutes
3. **HighMemoryUsage**: Backend using >500MB for 5 minutes
4. **HighCPUUsage**: CPU usage >80% for 5 minutes
5. **HighDiskUsage**: Disk usage >90%

#### Info Alerts

1. **LowCacheHitRate**: Cache hit rate <70% for 10 minutes

### Alert Notification Channels

Configure in `monitoring/alertmanager/config.yml`:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@multimedia-portal.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'
```

### Alert Routing

- **Critical** → Email + Webhook, repeat every 1 hour
- **Warning** → Email, repeat every 4 hours
- **Info** → Email, repeat every 12 hours

---

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=strong-password-here

# Alert Emails
ALERT_EMAIL_DEFAULT=team@multimedia-portal.com
ALERT_EMAIL_CRITICAL=oncall@multimedia-portal.com
ALERT_EMAIL_WARNING=dev@multimedia-portal.com
ALERT_EMAIL_INFO=monitoring@multimedia-portal.com

# Alert Webhook (optional - for Slack/Discord/PagerDuty)
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# SMTP for email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=alerts@multimedia-portal.com
```

### Prometheus Retention

Adjust retention in `docker-compose.monitoring.yml`:

```yaml
prometheus:
  command:
    - '--storage.tsdb.retention.time=30d'  # Change to 90d, 180d, etc.
```

### Scrape Intervals

Adjust in `monitoring/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s  # Change to 30s, 60s for less frequent scraping
```

---

## Troubleshooting

### Prometheus Not Scraping Targets

**Check target status:**
```bash
curl http://localhost:9090/api/v1/targets
```

**Common issues:**
- Service not running
- Port not exposed
- Wrong network configuration

**Fix:**
```bash
docker-compose -f docker-compose.monitoring.yml ps
docker network inspect multimedia-monitoring
```

### Grafana Can't Connect to Prometheus

**Check datasource:**
- Grafana → Configuration → Data Sources → Prometheus
- URL should be: `http://prometheus:9090`

**Fix:**
```bash
# Restart Grafana
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### High Memory Usage

**Reduce Prometheus retention:**
```yaml
# In docker-compose.monitoring.yml
'--storage.tsdb.retention.time=7d'  # Reduce from 30d
```

**Increase container memory limit:**
```yaml
prometheus:
  deploy:
    resources:
      limits:
        memory: 2G  # Increase from default
```

### Alerts Not Firing

**Check alert rules:**
```bash
curl http://localhost:9090/api/v1/rules
```

**Check Alertmanager:**
```bash
curl http://localhost:9093/api/v1/alerts
```

**Reload Prometheus config:**
```bash
curl -X POST http://localhost:9090/-/reload
```

### Missing Metrics

**Check application /metrics endpoint:**
```bash
curl http://localhost:4000/metrics
```

**Verify MetricsModule is loaded:**
- Check backend logs for "MetricsModule dependencies initialized"
- Verify `@willsoto/nestjs-prometheus` is installed

---

## Production Deployment

### Security Checklist

- [ ] Change Grafana default password
- [ ] Enable HTTPS for Grafana (reverse proxy)
- [ ] Restrict Prometheus to internal network
- [ ] Enable authentication for Prometheus (if exposed)
- [ ] Use secure SMTP credentials
- [ ] Enable firewall rules

### Performance Optimization

1. **Adjust scrape intervals** based on load
2. **Reduce retention** if storage is limited
3. **Use recording rules** for complex queries
4. **Enable compression** in Prometheus

### Backup Strategy

**Prometheus Data:**
```bash
# Backup
docker run --rm -v multimedia-portal_prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz /data

# Restore
docker run --rm -v multimedia-portal_prometheus_data:/data -v $(pwd):/backup alpine tar xzf /backup/prometheus-backup.tar.gz -C /
```

**Grafana Dashboards:**
```bash
# Export all dashboards
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3001/api/search?type=dash-db | jq -r '.[] | .uid' | xargs -I {} curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3001/api/dashboards/uid/{} > dashboards-backup.json
```

---

## Related Documentation

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Security Configuration](../backend/docs/SECURITY_CONFIGURATION.md)
- [Deployment Guide](../backend/docs/DEPLOYMENT_GUIDE.md)

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: DevOps Team
