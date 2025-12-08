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

# Load Node.js version manager if available
if command -v fnm &>/dev/null; then
    eval "$(fnm env)"
    fnm use --install-if-missing 2>/dev/null || true
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    \. "$NVM_DIR/nvm.sh"
    # nvm uses .nvmrc, not .node-version - use default or read .node-version
    if [[ -f .node-version ]]; then
        nvm use "$(cat .node-version)" 2>/dev/null || true
    fi
fi

# Check Node.js version (Vite 7.x requires Node 20.19+ or 22.12+)
REQUIRED_MAJOR=22
NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)

if [[ -z "$NODE_MAJOR" ]] || [[ "$NODE_MAJOR" -lt "$REQUIRED_MAJOR" ]]; then
    print_error "Node.js $REQUIRED_MAJOR+ is required (found: $(node -v 2>/dev/null || echo 'none'))"
    echo ""
    echo "Install a Node.js version manager and Node $REQUIRED_MAJOR:"
    echo ""
    echo "  Option 1 - nvm (recommended for Raspberry Pi):"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
    echo "    source ~/.bashrc"
    echo "    nvm install $REQUIRED_MAJOR"
    echo ""
    echo "  Option 2 - fnm (faster, requires 64-bit OS):"
    echo "    curl -fsSL https://fnm.vercel.app/install | bash"
    echo "    source ~/.bashrc"
    echo "    fnm install $REQUIRED_MAJOR"
    echo ""
    exit 1
fi

print_success "Using Node.js $(node -v)"

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

# Step 4: Update and restart service (if systemd service exists)
if systemctl is-enabled ruuvi-dashboard &>/dev/null; then
    print_step "Updating systemd service..."

    CURRENT_DIR=$(pwd)
    CURRENT_USER=$(whoami)
    NODE_PATH=$(which node)
    SERVICE_TEMPLATE="$CURRENT_DIR/scripts/ruuvi-dashboard.service"
    INSTALLED_SERVICE="/etc/systemd/system/ruuvi-dashboard.service"
    DAEMON_RELOAD_NEEDED=false

    # Regenerate .env.systemd if .env exists
    if [[ -f .env ]]; then
        grep -v '^#' .env | \
            grep -v '^[[:space:]]*$' | \
            sed 's/^export //' | \
            sed 's/[[:space:]]*=[[:space:]]*/=/' > .env.systemd
        print_success "Updated .env.systemd"
        ENV_FILE_LINE="EnvironmentFile=$CURRENT_DIR/.env.systemd"
    else
        ENV_FILE_LINE="# No .env file"
    fi

    # Update service file if template exists and has changed
    if [[ -f "$SERVICE_TEMPLATE" ]]; then
        # Generate new service file content
        NEW_SERVICE_CONTENT=$(sed -e "s|{{WORKING_DIR}}|$CURRENT_DIR|g" \
            -e "s|{{NODE_PATH}}|$NODE_PATH|g" \
            -e "s|{{USER}}|$CURRENT_USER|g" \
            -e "s|{{ENV_FILE}}|$ENV_FILE_LINE|g" \
            "$SERVICE_TEMPLATE")

        # Compare with installed service file
        if [[ -f "$INSTALLED_SERVICE" ]]; then
            CURRENT_SERVICE_CONTENT=$(sudo cat "$INSTALLED_SERVICE")
            if [[ "$NEW_SERVICE_CONTENT" != "$CURRENT_SERVICE_CONTENT" ]]; then
                echo "$NEW_SERVICE_CONTENT" | sudo tee "$INSTALLED_SERVICE" > /dev/null
                print_success "Updated service file from template"
                DAEMON_RELOAD_NEEDED=true
            else
                print_success "Service file unchanged"
            fi
        else
            echo "$NEW_SERVICE_CONTENT" | sudo tee "$INSTALLED_SERVICE" > /dev/null
            print_success "Created service file from template"
            DAEMON_RELOAD_NEEDED=true
        fi
    fi

    # Run daemon-reload if service file was updated
    if [[ "$DAEMON_RELOAD_NEEDED" == "true" ]]; then
        print_step "Reloading systemd daemon..."
        sudo systemctl daemon-reload
        print_success "Daemon reloaded"
    fi

    # Restart service (graceful - SIGTERM allows data flush)
    print_step "Restarting service..."
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
