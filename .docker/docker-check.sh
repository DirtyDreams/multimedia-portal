#!/bin/bash

echo "=== Docker Configuration Verification ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
echo "✅ Docker is installed: $(docker --version)"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi
echo "✅ Docker Compose is installed: $(docker-compose --version)"

# Check docker-compose.yml validity
echo ""
echo "=== Checking docker-compose.yml ==="
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has errors"
    docker-compose config
    exit 1
fi

# Check if required files exist
echo ""
echo "=== Checking required files ==="
files=("docker-compose.yml" "backend/Dockerfile" "frontend/Dockerfile" ".docker/nginx/nginx.conf")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Check directory structure
echo ""
echo "=== Checking directory structure ==="
dirs=("backend" "frontend" ".docker" "logs")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir directory exists"
    else
        echo "❌ $dir directory is missing"
        exit 1
    fi
done

# Test docker-compose build (without running)
echo ""
echo "=== Testing docker-compose configuration ==="
echo "To build and run all services, execute:"
echo "  docker-compose -f docker-compose.yml build"
echo "  docker-compose -f docker-compose.yml up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"

echo ""
echo "✅ All checks passed! Docker configuration is ready."
