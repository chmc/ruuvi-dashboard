#!/bin/bash
#
# Simple deployment script for Ruuvi Dashboard
# Works with systemd service (not pm2)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo "=========================================="
echo "  Ruuvi Dashboard Deployment"
echo "=========================================="

# Check if we're in the project directory
if [[ ! -f package.json ]] || ! grep -q "ruuvi-dashboard" package.json 2>/dev/null; then
    print_error "Please run this script from the ruuvi-dashboard project directory."
    exit 1
fi

# Load nvm if available (needed for correct Node.js version)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check Node.js version (Vite 7.x requires Node 20.19+ or 22.12+)
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1,2)
REQUIRED_VERSION="20.19"
if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
    print_error "Node.js $NODE_VERSION is too old. Vite requires Node.js 20.19+ or 22.12+"
    echo "Please upgrade: nvm install 22 && nvm use 22"
    exit 1
fi

# Step 1: Pull latest code
print_step "Pulling latest code from git..."
git pull origin main
print_success "Code updated"

# Step 2: Install dependencies
print_step "Installing dependencies..."
pnpm install
print_success "Dependencies installed"

# Step 3: Build frontend for production
print_step "Building React frontend..."
pnpm run build
print_success "Frontend built"

# Step 4: Restart service (if systemd service exists)
if systemctl is-enabled ruuvi-dashboard &>/dev/null; then
    print_step "Restarting systemd service..."

    # Regenerate .env.systemd if .env changed
    if [[ -f .env ]]; then
        grep -v '^#' .env | \
            grep -v '^[[:space:]]*$' | \
            sed 's/^export //' | \
            sed 's/[[:space:]]*=[[:space:]]*/=/' > .env.systemd
        print_success "Updated .env.systemd"
    fi

    sudo systemctl restart ruuvi-dashboard
    sleep 2

    if systemctl is-active --quiet ruuvi-dashboard; then
        print_success "Service restarted successfully"
        echo ""
        echo "View logs: sudo journalctl -u ruuvi-dashboard -f"
    else
        print_error "Service failed to start. Check logs:"
        echo "  sudo journalctl -u ruuvi-dashboard -n 50"
        exit 1
    fi
else
    print_warning "Systemd service not found."
    echo "Run setup script first: ./scripts/setup-raspberry-pi.sh"
    echo "Or start manually: pnpm run start:backend"
fi

echo ""
echo "=========================================="
print_success "Deployment complete!"
echo "=========================================="
