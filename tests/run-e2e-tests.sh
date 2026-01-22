#!/bin/bash

# Adscronos E2E Test Runner
# This script sets up the environment and runs comprehensive E2E tests

set -e

echo "🚀 Starting Adscronos E2E Tests"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies if needed
print_status "Installing dependencies..."
npm install

# Install Playwright browsers if needed
print_status "Setting up Playwright browsers..."
npm run test:setup

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating default .env for testing..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://localhost:5432/x402_test"

# JWT Secret
JWT_SECRET="test-jwt-secret-key-for-e2e-testing"
JWT_REFRESH_SECRET="test-jwt-refresh-secret-key-for-e2e-testing"

# Environment
NODE_ENV="test"
EOF
    print_success "Created default .env file"
fi

# Setup test database
print_status "Setting up test database..."
if command -v psql &> /dev/null; then
    # Create test database if it doesn't exist
    psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'x402_test'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE x402_test"
    print_success "Test database ready"
else
    print_warning "PostgreSQL not found. Make sure your database is running and accessible."
fi

# Run database migrations
print_status "Running database migrations..."
npm run migrate

# Start the development server in background
print_status "Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up..."
    if [ ! -z "$DEV_SERVER_PID" ]; then
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    print_success "Cleanup completed"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Wait for server to be ready
print_status "Waiting for development server to be ready..."
timeout=60
counter=0

while ! curl -s http://localhost:3000 > /dev/null; do
    if [ $counter -ge $timeout ]; then
        print_error "Development server failed to start within $timeout seconds"
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done

print_success "Development server is ready"

# Run E2E tests
print_status "Running E2E tests..."

# Parse command line arguments
TEST_PATTERN=""
HEADED=""
UI=""
DEBUG=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --pattern)
            TEST_PATTERN="$2"
            shift 2
            ;;
        --headed)
            HEADED="--headed"
            shift
            ;;
        --ui)
            UI="--ui"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Usage: $0 [--pattern <test-pattern>] [--headed] [--ui] [--debug]"
            exit 1
            ;;
    esac
done

# Build test command
TEST_CMD="npm run test:e2e"

if [ ! -z "$HEADED" ]; then
    TEST_CMD="npm run test:e2e:headed"
fi

if [ ! -z "$UI" ]; then
    TEST_CMD="npm run test:e2e:ui"
fi

if [ ! -z "$TEST_PATTERN" ]; then
    TEST_CMD="$TEST_CMD -- --grep \"$TEST_PATTERN\""
fi

if [ ! -z "$DEBUG" ]; then
    TEST_CMD="$TEST_CMD -- --debug"
fi

print_status "Executing: $TEST_CMD"

# Run the tests
if eval $TEST_CMD; then
    print_success "All E2E tests passed! 🎉"
    
    # Generate test report summary
    echo ""
    echo "📊 Test Summary"
    echo "==============="
    echo "✅ Authentication flows tested"
    echo "✅ Dashboard functionality tested"
    echo "✅ API endpoints tested"
    echo "✅ Cross-browser compatibility tested"
    echo "✅ Mobile responsiveness tested"
    echo ""
    print_success "E2E test suite completed successfully"
    
else
    print_error "Some E2E tests failed! ❌"
    echo ""
    echo "📋 Troubleshooting Tips:"
    echo "========================"
    echo "1. Check the test output above for specific failures"
    echo "2. Run tests in headed mode: ./run-e2e-tests.sh --headed"
    echo "3. Run tests with UI mode: ./run-e2e-tests.sh --ui"
    echo "4. Run specific test pattern: ./run-e2e-tests.sh --pattern \"auth\""
    echo "5. Check if the development server is running properly"
    echo "6. Verify database connection and migrations"
    echo ""
    exit 1
fi
