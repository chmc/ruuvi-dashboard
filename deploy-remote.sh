#!/bin/bash

# Remote Deployment Script for Ruuvi Dashboard
# This script pushes code to git and triggers deployment on Raspberry Pi via SSH

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "=========================================="
echo "Ruuvi Dashboard Remote Deployment"
echo "=========================================="
echo ""

# Load deployment configuration from deploy.env if it exists
if [ -f "deploy.env" ]; then
    print_step "Loading configuration from deploy.env..."
    # Export variables from deploy.env
    set -a
    source deploy.env
    set +a
    print_success "Configuration loaded"
    echo ""
fi

# Check if SSH configuration is provided
if [ -z "$RASP_USER" ] || [ -z "$RASP_HOST" ]; then
    print_warning "SSH configuration not found in environment variables"
    echo ""
    echo "Please provide Raspberry Pi SSH details:"
    read -p "Username (default: aleksi): " RASP_USER
    RASP_USER=${RASP_USER:-aleksi}
    read -p "Host IP or hostname: " RASP_HOST
    read -p "Project path on Raspberry Pi (default: /home/aleksi/repos/ruuvi-dashboard): " RASP_PATH
    RASP_PATH=${RASP_PATH:-/home/aleksi/repos/ruuvi-dashboard}
    echo ""
else
    RASP_PATH=${RASP_PATH:-/home/aleksi/repos/ruuvi-dashboard}
fi

# Step 1: Check for uncommitted changes
print_step "Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n): " commit_choice
    if [[ "$commit_choice" =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        print_success "Changes committed"
    else
        print_warning "Continuing without committing changes"
    fi
fi

echo ""

# Step 2: Push to git
print_step "Pushing code to git repository..."
if git push origin main; then
    print_success "Code pushed successfully"
else
    print_error "Failed to push code"
    exit 1
fi

echo ""

# Step 3: SSH to Raspberry Pi and run deployment
print_step "Connecting to Raspberry Pi at $RASP_USER@$RASP_HOST..."
echo ""

ssh "$RASP_USER@$RASP_HOST" "bash -s" << EOF
    set -e
    cd $RASP_PATH
    echo "=========================================="
    echo "Running deployment on Raspberry Pi"
    echo "=========================================="
    echo ""
    
    # Pull latest code
    echo "[STEP] Pulling latest code..."
    git pull origin main
    
    # Install dependencies
    echo ""
    echo "[STEP] Installing dependencies..."
    if ! npm install; then
        echo "[WARNING] npm install failed, trying to fix..."
        echo "[STEP] Cleaning npm cache and node_modules..."
        rm -rf node_modules package-lock.json
        npm cache clean --force
        echo "[STEP] Retrying npm install..."
        npm install
    fi
    
    # Restart PM2
    echo ""
    echo "[STEP] Restarting PM2 service..."
    if command -v pm2 &> /dev/null; then
        pm2 restart ruuvi-dashboard || pm2 start pm2.config.js
        echo ""
        echo "[STEP] PM2 Status:"
        pm2 status
    else
        echo "[WARNING] PM2 not found. Please restart the service manually."
    fi
    
    echo ""
    echo "=========================================="
    echo "[SUCCESS] Deployment completed!"
    echo "=========================================="
EOF

if [ $? -eq 0 ]; then
    echo ""
    print_success "Remote deployment completed successfully!"
    echo ""
    echo "Useful commands to run on Raspberry Pi:"
    echo "  ssh $RASP_USER@$RASP_HOST"
    echo "  pm2 logs ruuvi-dashboard"
    echo "  pm2 monit"
else
    print_error "Remote deployment failed"
    exit 1
fi

