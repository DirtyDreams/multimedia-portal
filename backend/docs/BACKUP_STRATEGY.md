# Database Backup Strategy

Comprehensive backup and disaster recovery documentation for Multimedia Portal PostgreSQL database.

---

## Table of Contents

1. [Overview](#overview)
2. [Backup Types](#backup-types)
3. [Retention Policy](#retention-policy)
4. [Backup Scripts](#backup-scripts)
5. [Automated Backups](#automated-backups)
6. [Restore Procedures](#restore-procedures)
7. [Verification](#verification)
8. [Monitoring](#monitoring)
9. [Disaster Recovery](#disaster-recovery)
10. [Best Practices](#best-practices)

---

## Overview

### Backup Strategy Goals

- **RPO (Recovery Point Objective)**: < 24 hours (maximum data loss)
- **RTO (Recovery Time Objective)**: < 1 hour (maximum downtime)
- **Backup Frequency**: Daily automated backups
- **Retention**: 7 days (daily), 30 days (weekly), 365 days (monthly)
- **Storage**: Local + Cloud (S3/MinIO) redundancy
- **Verification**: Automated integrity checks

### Backup Components

```
┌─────────────────────────────────────────────────┐
│          BACKUP INFRASTRUCTURE                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Primary Database                               │
│  ├─ PostgreSQL 15                               │
│  └─ Production Data                             │
│                                                  │
│  Backup Storage (Local)                         │
│  ├─ Daily Backups (7 days)                      │
│  ├─ Weekly Backups (30 days)                    │
│  └─ Monthly Backups (365 days)                  │
│                                                  │
│  Cloud Storage (S3/MinIO)                       │
│  ├─ Encrypted Backups                           │
│  ├─ Geo-redundant                               │
│  └─ Long-term Archive                           │
│                                                  │
│  Verification System                            │
│  ├─ Automated Integrity Checks                  │
│  ├─ Restore Testing                             │
│  └─ Alert on Failures                           │
└─────────────────────────────────────────────────┘
```

---

## Backup Types

### 1. Daily Backups

**Schedule**: Every day at 2:00 AM
**Retention**: 7 days
**Method**: `pg_dump` with custom format and compression

```bash
./scripts/backup-database.sh --type daily
```

**Use Case**: Regular point-in-time recovery

### 2. Weekly Backups

**Schedule**: Every Sunday at 3:00 AM
**Retention**: 30 days (4 weeks)
**Method**: Same as daily

```bash
./scripts/backup-database.sh --type weekly
```

**Use Case**: Monthly historical recovery

### 3. Monthly Backups

**Schedule**: 1st of every month at 4:00 AM
**Retention**: 365 days (12 months)
**Method**: Same as daily, archived to cloud storage

```bash
./scripts/backup-database.sh --type monthly
```

**Use Case**: Long-term archive and compliance

### 4. On-Demand Backups

**Trigger**: Manual or pre-deployment
**Retention**: As needed
**Use Case**: Before major changes or deployments

```bash
./scripts/backup-database.sh --type manual
```

---

## Retention Policy

### Retention Schedule

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Daily | Every day 2:00 AM | 7 days | Local + S3 |
| Weekly | Sunday 3:00 AM | 30 days | Local + S3 |
| Monthly | 1st of month 4:00 AM | 365 days | S3 only |
| Pre-deployment | Manual | 30 days | Local |

### Storage Requirements

**Estimated Sizes** (based on database size):

| Database Size | Daily Backup | Weekly Backup | Monthly Backup | Total Monthly Storage |
|---------------|--------------|---------------|----------------|----------------------|
| 1 GB | ~300 MB | ~300 MB | ~300 MB | ~7 GB |
| 10 GB | ~3 GB | ~3 GB | ~3 GB | ~70 GB |
| 100 GB | ~30 GB | ~30 GB | ~30 GB | ~700 GB |

### Cleanup Policy

Old backups are automatically deleted based on retention policy:

```bash
# Daily backups older than 7 days
find backups/postgres/daily -name "*.sql.gz" -mtime +7 -delete

# Weekly backups older than 30 days
find backups/postgres/weekly -name "*.sql.gz" -mtime +30 -delete

# Monthly backups older than 365 days
find backups/postgres/monthly -name "*.sql.gz" -mtime +365 -delete
```

---

## Backup Scripts

### Available Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `backup-database.sh` | Create database backups | `backend/scripts/` |
| `restore-database.sh` | Restore from backup | `backend/scripts/` |
| `docker-backup.sh` | Backup Docker containers | `backend/scripts/` |
| `verify-backups.sh` | Verify backup integrity | `backend/scripts/` |

### Script Features

**backup-database.sh:**
- Automated pg_dump with compression
- Configurable retention policies
- S3/MinIO upload support
- Email notifications
- Detailed logging
- Backup verification

**restore-database.sh:**
- Interactive or forced restore
- Pre-restore backup creation
- Rollback capability
- Connection termination
- Verification after restore

**docker-backup.sh:**
- Docker container backups
- docker-compose support
- No database credentials needed

**verify-backups.sh:**
- Integrity checking
- Verification reports
- Automated alerting

---

## Automated Backups

### Cron Setup

**1. Edit crontab:**
```bash
crontab -e
```

**2. Add backup schedule:**
```bash
# Daily backup at 2:00 AM
0 2 * * * /path/to/backend/scripts/backup-database.sh --type daily >> /var/log/backup.log 2>&1

# Weekly backup on Sunday at 3:00 AM
0 3 * * 0 /path/to/backend/scripts/backup-database.sh --type weekly >> /var/log/backup.log 2>&1

# Monthly backup on 1st at 4:00 AM
0 4 1 * * /path/to/backend/scripts/backup-database.sh --type monthly >> /var/log/backup.log 2>&1

# Verify backups daily at 6:00 AM
0 6 * * * /path/to/backend/scripts/verify-backups.sh >> /var/log/verify.log 2>&1
```

**3. Verify cron jobs:**
```bash
crontab -l
```

### Docker Automated Backups

**docker-compose.yml addition:**
```yaml
services:
  backup:
    image: postgres:15-alpine
    container_name: multimedia-backup
    environment:
      DB_NAME: multimedia_db
      DB_USER: multimedia_user
      DB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./backups:/backups
      - ./scripts:/scripts
    networks:
      - backend-network
    command: >
      sh -c "while true; do
        sleep 86400;
        /scripts/docker-backup.sh;
      done"
```

### Systemd Timer (Alternative to Cron)

**Create service file:** `/etc/systemd/system/multimedia-backup.service`
```ini
[Unit]
Description=Multimedia Portal Database Backup
After=postgresql.service

[Service]
Type=oneshot
User=backup
ExecStart=/path/to/backend/scripts/backup-database.sh
StandardOutput=journal
StandardError=journal
```

**Create timer file:** `/etc/systemd/system/multimedia-backup.timer`
```ini
[Unit]
Description=Daily Multimedia Portal Backup
Requires=multimedia-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable timer:**
```bash
sudo systemctl enable multimedia-backup.timer
sudo systemctl start multimedia-backup.timer
sudo systemctl status multimedia-backup.timer
```

---

## Restore Procedures

### Full Database Restore

**1. List available backups:**
```bash
ls -lh backups/postgres/daily/
```

**2. Restore from backup:**
```bash
./scripts/restore-database.sh /path/to/backup.sql.gz
```

**3. Verify restore:**
```bash
psql -U multimedia_user -d multimedia_db -c "SELECT COUNT(*) FROM users;"
```

### Point-in-Time Recovery

**1. Find backup closest to desired time:**
```bash
ls -lt backups/postgres/daily/ | grep "20250107"
```

**2. Restore that backup:**
```bash
./scripts/restore-database.sh backups/postgres/daily/multimedia_db_20250107_020000.sql.gz
```

### Partial Restore (Single Table)

**1. Extract table from backup:**
```bash
pg_restore -l backup.sql.gz | grep "TABLE DATA.*users" > table.list
pg_restore -L table.list -d multimedia_db backup.sql.gz
```

**2. Or use SQL:**
```bash
pg_restore -t users -d multimedia_db backup.sql.gz
```

### Docker Container Restore

**1. Stop application:**
```bash
docker-compose stop backend frontend
```

**2. Restore database:**
```bash
docker exec -i multimedia-postgres-prod psql -U multimedia_user multimedia_db < backup.sql
```

**3. Restart application:**
```bash
docker-compose start backend frontend
```

### Restore from S3

**1. Download backup:**
```bash
aws s3 cp s3://multimedia-backups/backups/daily/multimedia_db_20250107.sql.gz ./
```

**2. Restore:**
```bash
./scripts/restore-database.sh --from-s3 s3://multimedia-backups/backups/daily/multimedia_db_20250107.sql.gz
```

---

## Verification

### Automated Verification

**Run verification script:**
```bash
./scripts/verify-backups.sh
```

**Output:**
```
===============================================================================
                    BACKUP VERIFICATION REPORT
===============================================================================

Total Backups Checked: 45
Valid Backups:         45
Invalid Backups:       0
Total Size:            45 GB

✓ All backups verified successfully
===============================================================================
```

### Manual Verification

**1. Test restore to separate database:**
```bash
# Create test database
createdb multimedia_db_test

# Restore backup
pg_restore -d multimedia_db_test backup.sql.gz

# Verify tables
psql -d multimedia_db_test -c "\dt"

# Drop test database
dropdb multimedia_db_test
```

**2. Check backup file integrity:**
```bash
pg_restore --list backup.sql.gz | head -20
```

**3. Verify backup size:**
```bash
# Should be reasonable size (not 0 or suspiciously small)
ls -lh backup.sql.gz
```

### Scheduled Verification

Add to cron for daily verification:
```bash
0 6 * * * /path/to/backend/scripts/verify-backups.sh && \
  /path/to/backend/scripts/test-restore.sh || \
  echo "Backup verification failed" | mail -s "Backup Alert" admin@example.com
```

---

## Monitoring

### Backup Monitoring Checklist

- [ ] Backup completion status
- [ ] Backup file size
- [ ] Backup integrity
- [ ] Storage space availability
- [ ] S3 upload success
- [ ] Email notification delivery

### Monitoring Tools

**1. Custom Monitoring Script:**
```bash
#!/bin/bash
# Check latest backup age
latest_backup=$(find backups/postgres/daily -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 3600 ))

if [ $backup_age -gt 25 ]; then
    echo "WARNING: Latest backup is $backup_age hours old"
    exit 1
fi
```

**2. Prometheus Metrics:**
```yaml
# Add to prometheus.yml
scrape_configs:
  - job_name: 'backup-monitor'
    static_configs:
      - targets: ['localhost:9100']
    metrics_path: '/backup-metrics'
```

**3. Grafana Dashboard:**
- Backup success/failure rate
- Backup size over time
- Time to complete backup
- Storage usage trend
- Alert on backup failures

### Alert Configuration

**Email Alerts:**
```bash
# In backup-database.sh
if [ $? -ne 0 ]; then
    echo "Backup failed at $(date)" | mail -s "BACKUP FAILURE" admin@example.com
fi
```

**Slack/Discord Webhooks:**
```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"Database backup completed: $backup_file\"}"
```

---

## Disaster Recovery

### Disaster Recovery Plan

**RTO: 1 hour** | **RPO: 24 hours**

### Scenario 1: Database Corruption

**Detection:**
- Application errors
- Data inconsistencies
- Failed queries

**Recovery Steps:**
1. Identify scope of corruption
2. Stop application: `docker-compose stop backend`
3. Find latest valid backup
4. Restore database: `./scripts/restore-database.sh backup.sql.gz`
5. Verify data integrity
6. Start application: `docker-compose start backend`

**Estimated Time: 30-45 minutes**

### Scenario 2: Accidental Data Deletion

**Recovery Steps:**
1. Identify deletion time
2. Find backup before deletion
3. Extract deleted data:
   ```bash
   pg_restore -t deleted_table -d recovery_db backup.sql.gz
   ```
4. Re-insert data into production
5. Verify application functionality

**Estimated Time: 15-30 minutes**

### Scenario 3: Complete Server Failure

**Recovery Steps:**
1. Provision new server
2. Install PostgreSQL
3. Download latest backup from S3
4. Restore database
5. Update DNS/connection strings
6. Deploy application
7. Verify all services

**Estimated Time: 45-60 minutes**

### Scenario 4: Data Center Failure

**Recovery Steps:**
1. Activate disaster recovery site
2. Download backups from S3 (different region)
3. Restore database
4. Update application configuration
5. Switch DNS to DR site
6. Monitor and verify

**Estimated Time: 1-2 hours**

---

## Best Practices

### Backup Best Practices

1. **3-2-1 Rule**
   - 3 copies of data (production + 2 backups)
   - 2 different storage types (local + cloud)
   - 1 copy off-site (S3 different region)

2. **Test Restores Regularly**
   - Monthly restore test to verify backups work
   - Document restore time
   - Update procedures based on learnings

3. **Encrypt Backups**
   - Enable encryption at rest for S3
   - Consider GPG encryption for local backups
   - Protect backup credentials

4. **Monitor Everything**
   - Backup success/failure
   - Backup size trends
   - Storage capacity
   - Restore time metrics

5. **Document Procedures**
   - Keep this document updated
   - Document any manual steps
   - Train team on restore procedures

6. **Automate Verification**
   - Daily integrity checks
   - Weekly restore tests
   - Alert on any failures

7. **Secure Backup Storage**
   - Limit access to backup files
   - Use IAM roles for S3 access
   - Audit backup access logs

8. **Version Control Backup Scripts**
   - Keep scripts in git
   - Review changes before deployment
   - Test in staging first

### Compliance Considerations

**GDPR:**
- Right to be forgotten (purge from backups after retention)
- Data encryption
- Access logs

**SOC 2:**
- Regular backup testing
- Access controls
- Audit trails

**HIPAA** (if applicable):
- Encryption at rest and in transit
- Access logging
- Backup retention policies

---

## Troubleshooting

### Common Issues

**1. Backup Script Fails**

**Symptoms**: Backup not created, error in logs
**Causes**:
- Insufficient disk space
- Database connection issues
- Permission problems

**Solution**:
```bash
# Check disk space
df -h

# Test database connection
psql -U multimedia_user -d multimedia_db -c "SELECT 1"

# Check script permissions
chmod +x scripts/backup-database.sh
```

**2. Restore Fails**

**Symptoms**: Errors during restore, incomplete data
**Causes**:
- Corrupted backup file
- Version mismatch
- Insufficient permissions

**Solution**:
```bash
# Verify backup integrity
pg_restore --list backup.sql.gz

# Check PostgreSQL version
psql --version

# Ensure user has correct permissions
GRANT ALL PRIVILEGES ON DATABASE multimedia_db TO multimedia_user;
```

**3. S3 Upload Fails**

**Symptoms**: Local backup created but not in S3
**Causes**:
- Invalid credentials
- Network issues
- Bucket permissions

**Solution**:
```bash
# Test S3 connection
aws s3 ls s3://multimedia-backups/

# Verify credentials
aws sts get-caller-identity

# Check bucket policy
aws s3api get-bucket-policy --bucket multimedia-backups
```

---

## Appendix

### Configuration Files

**backup.config.sh** - Backup configuration
**cron-examples.txt** - Cron job templates
**.env** - Environment variables

### Scripts Reference

**backup-database.sh** - Main backup script
**restore-database.sh** - Restore script
**docker-backup.sh** - Docker backup support
**verify-backups.sh** - Verification script

### Useful Commands

```bash
# List all backups
find backups/postgres -name "*.sql.gz" -type f

# Get total backup size
du -sh backups/postgres

# Find backups older than 30 days
find backups/postgres -name "*.sql.gz" -mtime +30

# Count backups by type
find backups/postgres/daily -name "*.sql.gz" | wc -l

# Show newest backup
ls -lt backups/postgres/daily | head -2

# Test database connection
pg_isready -h localhost -p 5432 -U multimedia_user

# Show database size
psql -U multimedia_user -d multimedia_db -c "SELECT pg_size_pretty(pg_database_size('multimedia_db'));"
```

---

**Last Updated**: 2025-01-07
**Version**: 1.0
**Maintained By**: DevOps Team
**Review Schedule**: Quarterly
