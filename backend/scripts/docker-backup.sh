#!/bin/bash

###############################################################################
# Docker PostgreSQL Backup Script
#
# This script creates backups of PostgreSQL databases running in Docker
# containers using docker-compose or docker commands.
#
# Usage:
#   ./docker-backup.sh [options]
#
# Options:
#   -c, --container   Container name (default: multimedia-postgres-prod)
#   -t, --type        Backup type: daily, weekly, monthly
#   -h, --help        Show this help message
#
###############################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-multimedia-postgres-prod}"
DB_NAME="${DB_NAME:-multimedia_db}"
DB_USER="${DB_USER:-multimedia_user}"
BACKUP_TYPE="${1:-daily}"

# Backup directory
BACKUP_DIR="$PROJECT_ROOT/backups/postgres"
mkdir -p "$BACKUP_DIR"

# Log file
LOG_FILE="$PROJECT_ROOT/logs/backups/docker-backup-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

###############################################################################
# Functions
###############################################################################

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $*" | tee -a "$LOG_FILE"
}

# Check if container is running
check_container() {
    if ! docker ps --filter "name=$CONTAINER_NAME" --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
        log "ERROR: Container $CONTAINER_NAME is not running"
        return 1
    fi
    log "INFO: Container $CONTAINER_NAME is running"
    return 0
}

# Create backup using docker exec
create_docker_backup() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${DB_NAME}_docker_${backup_type}_${timestamp}.sql.gz"
    local backup_file="$BACKUP_DIR/$backup_name"

    log "INFO: Creating backup: $backup_name"

    # Execute pg_dump in container and compress
    if docker exec "$CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose 2>>"$LOG_FILE" | cat > "$backup_file"; then

        log "INFO: Backup created successfully: $backup_file"

        # Get file size
        local size=$(du -h "$backup_file" | cut -f1)
        log "INFO: Backup size: $size"

        echo "$backup_file"
        return 0
    else
        log "ERROR: Backup failed"
        return 1
    fi
}

# Create backup using docker-compose
create_compose_backup() {
    local backup_type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${DB_NAME}_compose_${backup_type}_${timestamp}.sql.gz"
    local backup_file="$BACKUP_DIR/$backup_name"

    log "INFO: Creating backup using docker-compose: $backup_name"

    cd "$PROJECT_ROOT"

    # Execute pg_dump via docker-compose
    if docker-compose exec -T postgres pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 2>>"$LOG_FILE" | cat > "$backup_file"; then

        log "INFO: Backup created successfully: $backup_file"

        local size=$(du -h "$backup_file" | cut -f1)
        log "INFO: Backup size: $size"

        echo "$backup_file"
        return 0
    else
        log "ERROR: Backup failed"
        return 1
    fi
}

# Copy backup file from container
copy_from_container() {
    local container_path="/tmp/backup.sql.gz"
    local local_path="$1"

    log "INFO: Copying backup from container"

    # Create backup inside container
    docker exec "$CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=9 \
        --file="$container_path" 2>>"$LOG_FILE"

    # Copy to host
    docker cp "$CONTAINER_NAME:$container_path" "$local_path"

    # Cleanup container backup
    docker exec "$CONTAINER_NAME" rm -f "$container_path"

    log "INFO: Backup copied to: $local_path"
}

###############################################################################
# Main
###############################################################################

main() {
    log "INFO: ====== Starting Docker database backup ======"

    # Check if container is running
    if ! check_container; then
        exit 1
    fi

    # Try docker-compose first, fall back to docker exec
    if command -v docker-compose &> /dev/null && [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log "INFO: Using docker-compose method"
        if backup_file=$(create_compose_backup "$BACKUP_TYPE"); then
            log "INFO: Backup completed successfully"
        else
            log "ERROR: Backup failed"
            exit 1
        fi
    else
        log "INFO: Using docker exec method"
        if backup_file=$(create_docker_backup "$BACKUP_TYPE"); then
            log "INFO: Backup completed successfully"
        else
            log "ERROR: Backup failed"
            exit 1
        fi
    fi

    log "INFO: ====== Backup process completed ======"
    exit 0
}

main "$@"
