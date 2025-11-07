#!/bin/bash

###############################################################################
# PostgreSQL Database Backup Script
#
# This script creates compressed backups of PostgreSQL databases with
# configurable retention policies and optional remote storage upload.
#
# Features:
# - Automated pg_dump with compression
# - Daily/weekly/monthly retention policies
# - Optional S3/MinIO upload
# - Backup verification
# - Email notifications
# - Detailed logging
#
# Usage:
#   ./backup-database.sh [options]
#
# Options:
#   -t, --type      Backup type: daily, weekly, monthly (default: daily)
#   -d, --database  Database name (default: from .env)
#   -h, --help      Show this help message
#
# Example:
#   ./backup-database.sh --type weekly
#
###############################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Configuration
BACKUP_TYPE="${1:-daily}"
DB_NAME="${DB_NAME:-multimedia_db}"
DB_USER="${DB_USER:-multimedia_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup directories
BACKUP_BASE_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_DIR="$BACKUP_BASE_DIR/postgres"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"

# Retention policies (days)
DAILY_RETENTION=${DAILY_RETENTION:-7}
WEEKLY_RETENTION=${WEEKLY_RETENTION:-30}
MONTHLY_RETENTION=${MONTHLY_RETENTION:-365}

# Logging
LOG_DIR="$PROJECT_ROOT/logs/backups"
LOG_FILE="$LOG_DIR/backup-$(date +%Y%m%d).log"

# Email notifications
ENABLE_EMAIL_NOTIFICATIONS="${ENABLE_EMAIL_NOTIFICATIONS:-false}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"

# S3/MinIO configuration
ENABLE_S3_UPLOAD="${ENABLE_S3_UPLOAD:-false}"
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"

###############################################################################
# Functions
###############################################################################

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Create directories if they don't exist
setup_directories() {
    mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR" "$LOG_DIR"
    log "INFO" "Backup directories created"
}

# Determine backup type based on date
determine_backup_type() {
    local day_of_month=$(date +%d)
    local day_of_week=$(date +%u)

    # Monthly backup on 1st of month
    if [ "$day_of_month" = "01" ]; then
        echo "monthly"
    # Weekly backup on Sunday (7)
    elif [ "$day_of_week" = "7" ]; then
        echo "weekly"
    else
        echo "daily"
    fi
}

# Create database backup
create_backup() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${DB_NAME}_${backup_type}_${timestamp}"

    # Determine backup directory
    case "$backup_type" in
        daily)
            local target_dir="$DAILY_DIR"
            ;;
        weekly)
            local target_dir="$WEEKLY_DIR"
            ;;
        monthly)
            local target_dir="$MONTHLY_DIR"
            ;;
        *)
            log "ERROR" "Invalid backup type: $backup_type"
            return 1
            ;;
    esac

    local backup_file="$target_dir/${backup_name}.sql.gz"

    log "INFO" "Starting $backup_type backup: $backup_name"

    # Create backup with pg_dump
    if PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="$backup_file" 2>>"$LOG_FILE"; then

        log "INFO" "Backup created successfully: $backup_file"

        # Get backup size
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log "INFO" "Backup size: $backup_size"

        # Verify backup
        if verify_backup "$backup_file"; then
            log "INFO" "Backup verification successful"

            # Upload to S3 if enabled
            if [ "$ENABLE_S3_UPLOAD" = "true" ]; then
                upload_to_s3 "$backup_file" "$backup_type"
            fi

            echo "$backup_file"
            return 0
        else
            log "ERROR" "Backup verification failed"
            rm -f "$backup_file"
            return 1
        fi
    else
        log "ERROR" "Backup creation failed"
        return 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    log "INFO" "Verifying backup: $backup_file"

    # Check if file exists and is not empty
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log "ERROR" "Backup file is empty or does not exist"
        return 1
    fi

    # Verify with pg_restore --list
    if PGPASSWORD="$DB_PASSWORD" pg_restore \
        --list "$backup_file" > /dev/null 2>&1; then
        return 0
    else
        log "ERROR" "Backup file is corrupted"
        return 1
    fi
}

# Upload backup to S3/MinIO
upload_to_s3() {
    local backup_file="$1"
    local backup_type="$2"
    local filename=$(basename "$backup_file")

    log "INFO" "Uploading to S3: $filename"

    # Use AWS CLI or MinIO client (mc)
    if command -v aws &> /dev/null; then
        AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
        AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
        aws s3 cp "$backup_file" \
            "s3://$S3_BUCKET/backups/$backup_type/$filename" \
            --endpoint-url "$S3_ENDPOINT" \
            2>>"$LOG_FILE"

        if [ $? -eq 0 ]; then
            log "INFO" "S3 upload successful"
        else
            log "ERROR" "S3 upload failed"
        fi
    elif command -v mc &> /dev/null; then
        mc cp "$backup_file" \
            "s3/$S3_BUCKET/backups/$backup_type/$filename" \
            2>>"$LOG_FILE"

        if [ $? -eq 0 ]; then
            log "INFO" "MinIO upload successful"
        else
            log "ERROR" "MinIO upload failed"
        fi
    else
        log "ERROR" "Neither AWS CLI nor MinIO client found"
    fi
}

# Clean old backups based on retention policy
cleanup_old_backups() {
    log "INFO" "Cleaning up old backups"

    # Clean daily backups
    find "$DAILY_DIR" -name "*.sql.gz" -type f -mtime +$DAILY_RETENTION -delete
    log "INFO" "Deleted daily backups older than $DAILY_RETENTION days"

    # Clean weekly backups
    find "$WEEKLY_DIR" -name "*.sql.gz" -type f -mtime +$WEEKLY_RETENTION -delete
    log "INFO" "Deleted weekly backups older than $WEEKLY_RETENTION days"

    # Clean monthly backups
    find "$MONTHLY_DIR" -name "*.sql.gz" -type f -mtime +$MONTHLY_RETENTION -delete
    log "INFO" "Deleted monthly backups older than $MONTHLY_RETENTION days"
}

# Send email notification
send_notification() {
    local status="$1"
    local backup_file="$2"

    if [ "$ENABLE_EMAIL_NOTIFICATIONS" != "true" ] || [ -z "$NOTIFICATION_EMAIL" ]; then
        return 0
    fi

    local subject="Database Backup $status - $(hostname)"
    local body="Database backup completed with status: $status\n\nBackup file: $backup_file\n\nTimestamp: $(date)"

    echo -e "$body" | mail -s "$subject" "$NOTIFICATION_EMAIL"
}

# Generate backup report
generate_report() {
    log "INFO" "Generating backup report"

    echo "=== Backup Report - $(date) ===" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Daily backups:" >> "$LOG_FILE"
    ls -lh "$DAILY_DIR" | tail -n +2 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Weekly backups:" >> "$LOG_FILE"
    ls -lh "$WEEKLY_DIR" | tail -n +2 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Monthly backups:" >> "$LOG_FILE"
    ls -lh "$MONTHLY_DIR" | tail -n +2 >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Calculate total backup size
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    echo "Total backup size: $total_size" >> "$LOG_FILE"
}

###############################################################################
# Main
###############################################################################

main() {
    log "INFO" "====== Starting database backup ======"

    # Setup
    setup_directories

    # Determine backup type if not specified
    if [ -z "${BACKUP_TYPE:-}" ]; then
        BACKUP_TYPE=$(determine_backup_type)
    fi

    log "INFO" "Backup type: $BACKUP_TYPE"

    # Create backup
    if backup_file=$(create_backup "$BACKUP_TYPE"); then
        log "INFO" "Backup completed successfully"

        # Cleanup old backups
        cleanup_old_backups

        # Generate report
        generate_report

        # Send success notification
        send_notification "SUCCESS" "$backup_file"

        log "INFO" "====== Backup process completed ======"
        exit 0
    else
        log "ERROR" "Backup failed"
        send_notification "FAILED" "N/A"
        log "ERROR" "====== Backup process failed ======"
        exit 1
    fi
}

# Run main function
main "$@"
