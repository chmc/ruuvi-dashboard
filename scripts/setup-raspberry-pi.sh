#!/bin/bash
#
# Ruuvi Dashboard - Raspberry Pi Setup Script
# Automates all setup steps from raspberrypi.instructions.md
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running on Raspberry Pi
check_raspberry_pi() {
    if [[ ! -f /proc/device-tree/model ]] || ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
        print_warning "This doesn't appear to be a Raspberry Pi. Continuing anyway..."
    else
        echo "Detected: $(cat /proc/device-tree/model)"
    fi
}

# Step 1: Install system dependencies
install_system_deps() {
    print_step "Installing system dependencies..."

    sudo apt-get update
    sudo apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev build-essential

    print_success "System dependencies installed"
}

# Step 2: Check Python version
check_python() {
    print_step "Checking Python version..."

    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f2)

    echo "Current Python version: $PYTHON_VERSION"

    if [[ "$PYTHON_MAJOR" -lt 3 ]] || [[ "$PYTHON_MAJOR" -eq 3 && "$PYTHON_MINOR" -lt 8 ]]; then
        print_warning "Python 3.8+ required for node-gyp. Installing Python 3.9..."
        sudo apt-get install -y python3.9

        # Set PYTHON env var for node-gyp
        export PYTHON=/usr/bin/python3.9

        # Add to bashrc if not already there
        if ! grep -q "export PYTHON=/usr/bin/python3" ~/.bashrc 2>/dev/null; then
            echo 'export PYTHON=/usr/bin/python3.9' >> ~/.bashrc
            print_success "Added PYTHON env var to ~/.bashrc"
        fi
    else
        print_success "Python version OK"
    fi
}

# Step 3: Check Node.js
check_nodejs() {
    print_step "Checking Node.js..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18+ first."
        echo "Recommended: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "             sudo apt-get install -y nodejs"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$NODE_VERSION" -lt 18 ]]; then
        print_error "Node.js 18+ required. Current version: $(node --version)"
        exit 1
    fi

    print_success "Node.js $(node --version) OK"
}

# Step 4: Check/install pnpm
check_pnpm() {
    print_step "Checking pnpm..."

    if ! command -v pnpm &> /dev/null; then
        echo "Installing pnpm..."
        npm install -g pnpm
    fi

    print_success "pnpm $(pnpm --version) OK"
}

# Step 5: Install dependencies
install_deps() {
    print_step "Installing project dependencies..."

    pnpm install

    print_success "Dependencies installed"
}

# Step 6: Approve native module builds
approve_native_builds() {
    print_step "Approving native module builds..."

    echo "You need to approve the following packages for native compilation:"
    echo "  - @abandonware/bluetooth-hci-socket"
    echo "  - @abandonware/noble"
    echo ""

    # Try to auto-approve if pnpm supports it
    if pnpm config get onlyBuiltDependencies &>/dev/null; then
        pnpm config set onlyBuiltDependencies "@abandonware/bluetooth-hci-socket,@abandonware/noble" --location project 2>/dev/null || true
    fi

    echo "Running pnpm approve-builds (select the bluetooth packages with space, then press Enter)..."
    pnpm approve-builds || true

    print_step "Reinstalling with native builds..."
    pnpm install

    print_success "Native modules built"
}

# Step 7: Grant Bluetooth permissions
grant_bluetooth_permissions() {
    print_step "Granting Bluetooth permissions to Node.js..."

    NODE_PATH=$(readlink -f "$(which node)")
    sudo setcap cap_net_raw+eip "$NODE_PATH"

    print_success "Bluetooth permissions granted to $NODE_PATH"
}

# Step 8: Enable Bluetooth
enable_bluetooth() {
    print_step "Enabling Bluetooth..."

    sudo systemctl restart bluetooth
    sleep 2

    if ! sudo hciconfig hci0 up 2>/dev/null; then
        print_warning "Could not enable hci0. You may need to reboot."
    else
        print_success "Bluetooth enabled"
    fi
}

# Step 9: Configure environment
configure_env() {
    print_step "Configuring environment..."

    if [[ -f .env ]]; then
        print_warning ".env file already exists. Skipping..."
        echo "Edit .env manually to update RuuviTag MAC addresses."
        return
    fi

    if [[ -f .env.example ]]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    else
        cat > .env << 'EOF'
# RuuviTag MAC addresses (comma-separated)
REACT_APP_RUUVITAG_MACS=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66

# Main indoor sensor MAC
REACT_APP_MAIN_INDOOR_RUUVITAG_MAC=AA:BB:CC:DD:EE:FF

# Main outdoor sensor MAC
REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC=11:22:33:44:55:66
EOF
        print_success "Created default .env file"
    fi

    echo ""
    echo "IMPORTANT: Edit .env with your actual RuuviTag MAC addresses:"
    echo "  nano .env"
}

# Step 10: Verify installation
verify_installation() {
    print_step "Verifying installation..."

    # Check if port is already in use
    if lsof -i :3001 > /dev/null 2>&1; then
        print_warning "Port 3001 already in use. Assuming server is running."
        if curl -s http://localhost:3001/api/ruuvi > /dev/null 2>&1; then
            print_success "Existing server is responding"
            VERIFICATION_PASSED=true
        else
            print_warning "Existing server not responding"
            VERIFICATION_PASSED=false
        fi
        return
    fi

    echo "Starting backend server for verification..."

    # Start the backend in background
    pnpm run start:backend > /tmp/ruuvi-verify.log 2>&1 &
    SERVER_PID=$!

    # Give it a moment to spawn children
    sleep 1

    # Wait for server to start (check every second, max 15 seconds)
    for i in {1..15}; do
        sleep 1
        if curl -s http://localhost:3001/api/ruuvi > /dev/null 2>&1; then
            print_success "Backend server is running correctly"
            VERIFICATION_PASSED=true
            break
        fi
        echo -n "."
    done
    echo ""

    if [[ "$VERIFICATION_PASSED" != "true" ]]; then
        print_warning "Could not verify backend server"
        echo "Check logs: /tmp/ruuvi-verify.log"
        VERIFICATION_PASSED=false
    fi

    # Stop the test server - kill the entire process group
    pkill -P $SERVER_PID 2>/dev/null || true
    kill $SERVER_PID 2>/dev/null || true

    # Also kill any node process on port 3001
    lsof -ti :3001 | xargs kill 2>/dev/null || true

    sleep 2
}

# Step 11: Setup systemd service (optional, only if verification passed)
setup_systemd_service() {
    if [[ "$VERIFICATION_PASSED" != "true" ]]; then
        print_warning "Skipping systemd setup - verification did not pass"
        echo "Fix any issues first, then run this script again."
        return
    fi

    print_step "Setting up systemd service..."

    echo ""
    echo "Everything is working! Would you like to set up auto-start on boot?"
    read -p "Install systemd service? [y/N] " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping systemd service setup."
        return
    fi

    CURRENT_USER=$(whoami)
    CURRENT_DIR=$(pwd)
    NODE_PATH=$(which node)
    PNPM_PATH=$(which pnpm)

    # Verify paths exist
    if [[ ! -x "$NODE_PATH" ]]; then
        print_error "Node.js not found at $NODE_PATH"
        return 1
    fi

    if [[ ! -x "$PNPM_PATH" ]]; then
        print_error "pnpm not found at $PNPM_PATH"
        return 1
    fi

    # Convert .env to systemd EnvironmentFile format
    # Systemd requires: KEY=value (no spaces around =)
    if [[ -f "$CURRENT_DIR/.env" ]]; then
        # Create systemd-compatible env file:
        # - Remove comments and empty lines
        # - Remove 'export ' prefix
        # - Remove spaces around '='
        grep -v '^#' "$CURRENT_DIR/.env" | \
            grep -v '^[[:space:]]*$' | \
            sed 's/^export //' | \
            sed 's/[[:space:]]*=[[:space:]]*/=/' > "$CURRENT_DIR/.env.systemd"
        print_success "Created .env.systemd for service"
        ENV_FILE_LINE="EnvironmentFile=$CURRENT_DIR/.env.systemd"
    else
        print_warning "No .env file found - service will use defaults"
        ENV_FILE_LINE="# No .env file"
    fi

    sudo tee /etc/systemd/system/ruuvi-dashboard.service > /dev/null << EOF
[Unit]
Description=Ruuvi Dashboard
After=network.target bluetooth.target
Wants=bluetooth.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$CURRENT_DIR

# Load environment from .env file
$ENV_FILE_LINE
Environment=NODE_ENV=production

# Run node directly with absolute path
ExecStart=$NODE_PATH $CURRENT_DIR/server/index.js

Restart=on-failure
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ruuvi-dashboard

[Install]
WantedBy=multi-user.target
EOF

    print_success "Created systemd service"

    # Grant BLE capabilities to node binary (more reliable than AmbientCapabilities)
    print_step "Ensuring BLE permissions for node..."
    sudo setcap cap_net_raw+eip "$NODE_PATH" 2>/dev/null || print_warning "Could not set capabilities on node"

    sudo systemctl daemon-reload
    sudo systemctl enable ruuvi-dashboard
    sudo systemctl start ruuvi-dashboard

    sleep 2

    if systemctl is-active --quiet ruuvi-dashboard; then
        print_success "Systemd service installed, enabled, and running"
    else
        print_warning "Service installed but may not be running. Check logs:"
        echo "  sudo journalctl -u ruuvi-dashboard -f"
    fi

    echo ""
    echo "Service commands:"
    echo "  sudo systemctl start ruuvi-dashboard"
    echo "  sudo systemctl stop ruuvi-dashboard"
    echo "  sudo systemctl restart ruuvi-dashboard"
    echo "  sudo journalctl -u ruuvi-dashboard -f"
    echo ""
    echo "Note: If you update .env later, regenerate the systemd env file:"
    echo "  ./scripts/setup-raspberry-pi.sh  # Run setup again (safe)"
    echo "  # OR manually:"
    echo "  grep -v '^#' .env | grep -v '^\$' | sed 's/^export //' | sed 's/ *= */=/' > .env.systemd"
    echo "  sudo systemctl restart ruuvi-dashboard"
}

# Main script
main() {
    echo "========================================"
    echo "  Ruuvi Dashboard - Raspberry Pi Setup"
    echo "========================================"

    check_raspberry_pi

    # Check if we're in the project directory
    if [[ ! -f package.json ]] || ! grep -q "ruuvi-dashboard" package.json 2>/dev/null; then
        print_error "Please run this script from the ruuvi-dashboard project directory."
        echo ""
        echo "If you haven't cloned the repo yet:"
        echo "  git clone https://github.com/chmc/ruuvi-dashboard.git"
        echo "  cd ruuvi-dashboard"
        echo "  ./scripts/setup-raspberry-pi.sh"
        exit 1
    fi

    install_system_deps
    check_python
    check_nodejs
    check_pnpm
    install_deps
    approve_native_builds
    grant_bluetooth_permissions
    enable_bluetooth
    configure_env
    verify_installation
    setup_systemd_service

    echo ""
    echo "========================================"
    echo -e "  ${GREEN}Setup Complete!${NC}"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env with your RuuviTag MAC addresses"
    echo "  2. Start the application: pnpm start"
    echo "  3. Access dashboard at: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "If Bluetooth doesn't work, try rebooting: sudo reboot"
}

main "$@"
