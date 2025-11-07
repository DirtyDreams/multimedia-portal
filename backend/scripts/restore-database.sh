#!/bin/bash

###############################################################################
# PostgreSQL Database Restore Script
#
# This script restores PostgreSQL database from backup files created by
# backup-database.sh
#
# Features:
# - Restore from local or S3 backups
# - Pre-restore database backup
# - Restore verification
# - Detailed logging
# - Rollback capability
#
# Usage:
#   ./restore-database.sh <backup_file> [options]
#
# Options:
#   -f, --force        Force restore without confirmation
#   -s, --from-s3      Restore from S3 backup
#   -d, --database     Target database name
#   --no-backup        Skip pre-restore backup
#   -h, --help         Show this help message
#
# Example:
#   ./restore-database.sh /path/to/backup.sql.gz
#   ./restore-database.sh --from-s3 s3://bucket/backup.sql.gz
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
DB_NAME="${DB_NAME:-multimedia_db}"
DB_USER="${DB_USER:-multimedia_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Logging
LOG_DIR="$PROJECT_ROOT/logs/backups"
LOG_FILE="$LOG_DIR/restore-$(date +%Y%m%d_%H%M%S).log"

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

# Show help
show_help() {
    cat << EOF
PostgreSQL Database Restore Script

Usage: $0 <backup_file> [options]

Options:
  -f, --force        Force restore without confirmation
  -s, --from-s3      Restore from S3 backup
  -d, --database     Target database name (default: $DB_NAME)
  --no-backup        Skip pre-restore backup
  -h, --help         Show this help message

Examples:
  $0 /backups/multimedia_db_daily_20250107.sql.gz
  $0 --from-s3 s3://bucket/backup.sql.gz --force

EOF
}

# Verify backup file
verify_backup() {
    local backup_file="$1"

    log "INFO" "Verifying backup file: $backup_file"

    if [ ! -f "$backup_file" ]; then
        log "ERROR" "Backup file not found: $backup_file"
        return 1
    fi

    if [ ! -s "$backup_file" ]; then
        log "ERROR" "Backup file is empty: $backup_file"
        return 1
    fi

    # Verify with pg_restore --list
    if PGPASSWORD="$DB_PASSWORD" pg_restore \
        --list "$backup_file" > /dev/null 2>&1; then
        log "INFO" "Backup file verification successful"
        return 0
    else
        log "ERROR" "Backup file is corrupted or invalid format"
        return 1
    fi
}

# Create pre-restore backup
create_prestore_backup() {
    local backup_dir="$PROJECT_ROOT/backups/postgres/pre-restore"
    mkdir -p "$backup_dir"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/${DB_NAME}_pre_restore_${timestamp}.sql.gz"

    log "INFO" "Creating pre-restore backup: $backup_file"

    if PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --file="$backup_file" 2>>"$LOG_FILE"; then

        log "INFO" "Pre-restore backup created successfully"
        echo "$backup_file"
        return 0
    else
        log "ERROR" "Pre-restore backup failed"
        return 1
    fi
}

# Terminate active connections
terminate_connections() {
    local db_name="$1"

    log "INFO" "Terminating active connections to database: $db_name"

    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "postgres" \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name' AND pid <> pg_backend_pid();" \
        2>>"$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "INFO" "Active connections terminated"
        return 0
    else
        log "ERROR" "Failed to terminate connections"
        return 1
    fi
}

# Drop and recreate database
recreate_database() {
    local db_name="$1"

    log "INFO" "Recreating database: $db_name"

    # Drop database
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "postgres" \
        -c "DROP DATABASE IF EXISTS $db_name;" \
        2>>"$LOG_FILE"

    # Create database
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "postgres" \
        -c "CREATE DATABASE $db_name OWNER $DB_USER;" \
        2>>"$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "INFO" "Database recreated successfully"
        return 0
    else
        log "ERROR" "Failed to recreate database"
        return 1
    fi
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    local db_name="$2"

    log "INFO" "Restoring database from: $backup_file"

    if PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$db_name" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        "$backup_file" 2>>"$LOG_FILE"; then

        log "INFO" "Database restored successfully"
        return 0
    else
        log "ERROR" "Database restore failed"
        return 1
    fi
}

# Verify restored database
verify_restore() {
    local db_name="$1"

    log "INFO" "Verifying restored database"

    # Check if database exists
    local db_exists=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "postgres" \
        -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name';")

    if [ "$db_exists" != "1" ]; then
        log "ERROR" "Database does not exist after restore"
        return 1
    fi

    # Check table count
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$db_name" \
        -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

    log "INFO" "Database contains $table_count tables"

    if [ "$table_count" -gt 0 ]; then
        log "INFO" "Database verification successful"
        return 0
    else
        log "ERROR" "Database appears to be empty"
        return 1
    fi
}

# Download backup from S3
download_from_s3() {
    local s3_path="$1"
    local local_file="/tmp/$(basename "$s3_path")"

    log "INFO" "Downloading from S3: $s3_path"

    if command -v aws &> /dev/null; then
        aws s3 cp "$s3_path" "$local_file" 2>>"$LOG_FILE"
    elif command -v mc &> /dev/null; then
        mc cp "$s3_path" "$local_file" 2>>"$LOG_FILE"
    else
        log "ERROR" "Neither AWS CLI nor MinIO client found"
        return 1
    fi

    if [ $? -eq 0 ]; then
        log "INFO" "Download successful: $local_file"
        echo "$local_file"
        return 0
    else
        log "ERROR" "Download failed"
        return 1
    fi
}

###############################################################################
# Main
###############################################################################

main() {
    local backup_file=""
    local force=false
    local from_s3=false
    local skip_backup=false
    local target_db="$DB_NAME"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -s|--from-s3)
                from_s3=true
                shift
                ;;
            -d|--database)
                target_db="$2"
                shift 2
                ;;
            --no-backup)
                skip_backup=true
                shift
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done

    # Check if backup file is provided
    if [ -z "$backup_file" ]; then
        log "ERROR" "No backup file specified"
        show_help
        exit 1
    fi

    log "INFO" "====== Starting database restore ======"

    # Download from S3 if needed
    if [ "$from_s3" = true ]; then
        if local_backup=$(download_from_s3 "$backup_file"); then
            backup_file="$local_backup"
        else
            log "ERROR" "Failed to download backup from S3"
            exit 1
        fi
    fi

    # Verify backup file
    if ! verify_backup "$backup_file"; then
        log "ERROR" "Backup verification failed"
        exit 1
    fi

    # Confirmation prompt
    if [ "$force" != true ]; then
        echo ""
        echo "WARNING: This will replace the current database!"
        echo "Database: $target_db"
        echo "Backup file: $backup_file"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            log "INFO" "Restore cancelled by user"
            exit 0
        fi
    fi

    # Create pre-restore backup
    if [ "$skip_backup" != true ]; then
        if ! prestore_backup=$(create_prestore_backup); then
            log "ERROR" "Failed to create pre-restore backup"
            echo "Continue without pre-restore backup? (yes/no): "
            read continue_anyway
            if [ "$continue_anyway" != "yes" ]; then
                exit 1
            fi
        else
            log "INFO" "Pre-restore backup saved: $prestore_backup"
        fi
    fi

    # Terminate active connections
    if ! terminate_connections "$target_db"; then
        log "WARNING" "Could not terminate all connections"
    fi

    # Recreate database
    if ! recreate_database "$target_db"; then
        log "ERROR" "Failed to recreate database"
        exit 1
    fi

    # Restore database
    if ! restore_database "$backup_file" "$target_db"; then
        log "ERROR" "Database restore failed"
        echo "Rollback to pre-restore backup? (yes/no): "
        read rollback
        if [ "$rollback" = "yes" ] && [ -n "${prestore_backup:-}" ]; then
            log "INFO" "Rolling back to pre-restore backup"
            recreate_database "$target_db"
            restore_database "$prestore_backup" "$target_db"
        fi
        exit 1
    fi

    # Verify restore
    if ! verify_restore "$target_db"; then
        log "ERROR" "Restore verification failed"
        exit 1
    fi

    log "INFO" "====== Database restore completed successfully ======"
    echo ""
    echo "Database has been successfully restored from: $backup_file"
    if [ -n "${prestore_backup:-}" ]; then
        echo "Pre-restore backup saved at: $prestore_backup"
    fi
    echo ""

    # Cleanup temporary S3 download
    if [ "$from_s3" = true ] && [ -f "$backup_file" ]; then
        rm -f "$backup_file"
    fi

    exit 0
}

# Run main function
main "$@"
