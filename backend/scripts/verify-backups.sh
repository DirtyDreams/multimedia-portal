#!/bin/bash

###############################################################################
# Backup Verification Script
#
# This script verifies the integrity of all backup files and generates
# a verification report.
#
# Usage:
#   ./verify-backups.sh [backup_directory]
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
BACKUP_DIR="${1:-$PROJECT_ROOT/backups/postgres}"
LOG_FILE="$PROJECT_ROOT/logs/backups/verify-$(date +%Y%m%d).log"

# Results
TOTAL_BACKUPS=0
VALID_BACKUPS=0
INVALID_BACKUPS=0
VERIFIED_SIZE=0

###############################################################################
# Functions
###############################################################################

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $*" | tee -a "$LOG_FILE"
}

# Verify single backup file
verify_backup() {
    local backup_file="$1"

    log "INFO: Verifying: $(basename "$backup_file")"

    # Check if file exists and is not empty
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log "ERROR: File is empty or does not exist"
        return 1
    fi

    # Get file size
    local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
    VERIFIED_SIZE=$((VERIFIED_SIZE + size))

    # Verify with pg_restore
    if pg_restore --list "$backup_file" > /dev/null 2>&1; then
        log "INFO: ✓ Valid backup"
        return 0
    else
        log "ERROR: ✗ Invalid or corrupted backup"
        return 1
    fi
}

# Generate verification report
generate_report() {
    local report_file="$PROJECT_ROOT/logs/backups/verification-report-$(date +%Y%m%d).txt"

    cat > "$report_file" <<EOF
===============================================================================
                    BACKUP VERIFICATION REPORT
===============================================================================

Date: $(date '+%Y-%m-%d %H:%M:%S')
Backup Directory: $BACKUP_DIR

SUMMARY:
--------
Total Backups Checked: $TOTAL_BACKUPS
Valid Backups:         $VALID_BACKUPS
Invalid Backups:       $INVALID_BACKUPS
Total Size:            $(numfmt --to=iec $VERIFIED_SIZE 2>/dev/null || echo "$VERIFIED_SIZE bytes")

BACKUP TYPES:
-------------
EOF

    # Count backups by type
    for type in daily weekly monthly; do
        local count=$(find "$BACKUP_DIR/$type" -name "*.sql.gz" -type f 2>/dev/null | wc -l)
        echo "$type backups: $count" >> "$report_file"
    done

    cat >> "$report_file" <<EOF

OLDEST BACKUP:
--------------
EOF
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T+ %p\n' 2>/dev/null | sort | head -1 >> "$report_file" || echo "N/A" >> "$report_file"

    cat >> "$report_file" <<EOF

NEWEST BACKUP:
--------------
EOF
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -1 >> "$report_file" || echo "N/A" >> "$report_file"

    cat >> "$report_file" <<EOF

STATUS:
-------
EOF

    if [ $INVALID_BACKUPS -eq 0 ]; then
        echo "✓ All backups verified successfully" >> "$report_file"
    else
        echo "✗ $INVALID_BACKUPS backup(s) failed verification" >> "$report_file"
    fi

    cat >> "$report_file" <<EOF

===============================================================================
                          END OF REPORT
===============================================================================
EOF

    log "INFO: Verification report saved to: $report_file"
    cat "$report_file"
}

###############################################################################
# Main
###############################################################################

main() {
    log "INFO: ====== Starting backup verification ======"

    if [ ! -d "$BACKUP_DIR" ]; then
        log "ERROR: Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi

    log "INFO: Scanning backup directory: $BACKUP_DIR"

    # Find all backup files
    while IFS= read -r backup_file; do
        TOTAL_BACKUPS=$((TOTAL_BACKUPS + 1))

        if verify_backup "$backup_file"; then
            VALID_BACKUPS=$((VALID_BACKUPS + 1))
        else
            INVALID_BACKUPS=$((INVALID_BACKUPS + 1))
        fi
    done < <(find "$BACKUP_DIR" -name "*.sql.gz" -type f 2>/dev/null || true)

    log "INFO: Verification complete"
    log "INFO: Valid: $VALID_BACKUPS, Invalid: $INVALID_BACKUPS, Total: $TOTAL_BACKUPS"

    # Generate report
    generate_report

    log "INFO: ====== Verification process completed ======"

    # Exit with error if any backups are invalid
    if [ $INVALID_BACKUPS -gt 0 ]; then
        exit 1
    fi

    exit 0
}

main "$@"
