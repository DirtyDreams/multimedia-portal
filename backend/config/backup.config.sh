#!/bin/bash

###############################################################################
# Backup Configuration
#
# This file contains configuration for database backup scripts.
# Copy this file to .env and customize values for your environment.
#
###############################################################################

# Database Configuration
export DB_NAME="multimedia_db"
export DB_USER="multimedia_user"
export DB_PASSWORD="your_database_password"
export DB_HOST="localhost"
export DB_PORT="5432"

# Backup Directories
export BACKUP_DIR="/var/backups/multimedia-portal"

# Retention Policies (days)
export DAILY_RETENTION=7        # Keep daily backups for 7 days
export WEEKLY_RETENTION=30      # Keep weekly backups for 30 days
export MONTHLY_RETENTION=365    # Keep monthly backups for 1 year

# S3/MinIO Configuration
export ENABLE_S3_UPLOAD="false"
export S3_BUCKET="multimedia-backups"
export S3_ENDPOINT="https://s3.amazonaws.com"
export S3_ACCESS_KEY="your_access_key"
export S3_SECRET_KEY="your_secret_key"

# Email Notifications
export ENABLE_EMAIL_NOTIFICATIONS="false"
export NOTIFICATION_EMAIL="admin@example.com"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="notifications@example.com"
export SMTP_PASSWORD="your_smtp_password"

# Logging
export LOG_LEVEL="INFO"  # DEBUG, INFO, WARNING, ERROR

# Compression
export COMPRESSION_LEVEL=9  # 1-9, where 9 is maximum compression

# Backup Verification
export VERIFY_BACKUPS="true"

# Parallel Compression (requires pigz)
export USE_PARALLEL_COMPRESSION="false"
export COMPRESSION_THREADS=4
