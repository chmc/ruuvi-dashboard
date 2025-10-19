#!/bin/bash

# Ruuvi Dashboard Deployment Script
# This script pulls the latest code and deploys it to Raspberry Pi

set -e  # Exit on any error

echo "=========================================="
echo "Ruuvi Dashboard Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Pull latest code
print_step "Pulling latest code from git..."
if git pull origin main; then
    print_success "Code pulled successfully"
else
    print_error "Failed to pull code"
    exit 1
fi

echo ""

# Step 2: Install/Update dependencies
print_step "Installing/Updating dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    print_step "Cleaning npm cache and node_modules..."
    rm -rf node_modules package-lock.json
    npm cache clean --force
    print_step "Retrying npm install..."
    if npm install; then
        print_success "Dependencies installed successfully after cleanup"
    else
        print_step "Trying with increased memory..."
        if npm install --max-old-space-size=4096; then
            print_success "Dependencies installed with increased memory"
        else
            print_error "Failed to install dependencies even with increased memory"
            exit 1
        fi
    fi
fi

echo ""

# Step 3: Build React app (optional, uncomment if you want to build)
# print_step "Building React app..."
# if npm run build; then
#     print_success "Build completed successfully"
# else
#     print_error "Build failed"
#     exit 1
# fi
# echo ""

# Step 4: Restart PM2 service (if PM2 is running)
print_step "Checking if PM2 is running..."
if command -v pm2 &> /dev/null; then
    print_step "Restarting PM2 service..."
    if pm2 restart ruuvi-dashboard; then
        print_success "PM2 service restarted successfully"
    else
        print_error "Failed to restart PM2 service"
        print_step "Trying to start PM2 service from config..."
        if pm2 start pm2.config.js; then
            print_success "PM2 service started successfully"
        else
            print_error "Failed to start PM2 service"
            exit 1
        fi
    fi
    
    echo ""
    print_step "Showing PM2 status..."
    pm2 status
else
    print_error "PM2 is not installed. Please install it with: sudo npm install pm2 -g"
    print_step "You can manually start the app with: npm start"
fi

echo ""
echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs"
echo "  - Monitor: pm2 monit"
echo "  - Check status: pm2 status"
echo "  - Restart: pm2 restart ruuvi-dashboard"
echo ""

