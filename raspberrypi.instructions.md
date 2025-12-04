# Raspberry Pi Setup Instructions

Step-by-step guide to get the Ruuvi Dashboard running on Raspberry Pi.

## Quick Start (Automated)

After cloning the repository, run the setup script:

```bash
git clone https://github.com/chmc/ruuvi-dashboard.git
cd ruuvi-dashboard
./scripts/setup-raspberry-pi.sh
```

The script automates all steps below. For manual setup, continue reading.

---

## Prerequisites

- Raspberry Pi with Bluetooth (tested on Pi 3/4)
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

## 1. Install System Dependencies

```bash
sudo apt-get update
sudo apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev build-essential
```

## 2. Ensure Python 3.8+ is Available

The native BLE module requires Python 3.8+ for compilation. Check your version:

```bash
python3 --version
```

If it shows Python 3.6 or 3.7, install a newer version:

```bash
sudo apt-get install python3.9
```

Set the Python path for node-gyp:

```bash
export PYTHON=/usr/bin/python3.9
```

Add this to your `~/.bashrc` to make it permanent.

## 3. Clone and Install

```bash
git clone https://github.com/chmc/ruuvi-dashboard.git
cd ruuvi-dashboard
pnpm install
```

## 4. Approve Native Module Builds

pnpm blocks native module compilation by default. You must approve it:

```bash
pnpm approve-builds
```

Select these packages using space bar:

- `@abandonware/bluetooth-hci-socket`
- `@abandonware/noble`

Press Enter to confirm, then reinstall:

```bash
pnpm install
```

Watch for compilation output - you should see `node-gyp` building the native modules.

## 5. Grant Bluetooth Permissions

Allow Node.js to access Bluetooth without sudo:

```bash
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

## 6. Enable Bluetooth

```bash
sudo hciconfig hci0 up
```

If you get "Connection timed out", restart the Bluetooth service:

```bash
sudo systemctl restart bluetooth
```

Or reboot the Pi:

```bash
sudo reboot
```

## 7. Configure Environment

Create `.env` file with your RuuviTag MAC addresses:

```bash
cp .env.example .env
```

Edit `.env` and set:

```
REACT_APP_RUUVITAG_MACS=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66
REACT_APP_MAIN_INDOOR_RUUVITAG_MAC=AA:BB:CC:DD:EE:FF
REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC=11:22:33:44:55:66
```

## 8. Start the Application

```bash
pnpm start
```

This starts both:

- Frontend on port 3000
- Backend on port 3001

Access the dashboard at `http://<pi-ip>:3000`

## Troubleshooting

### "Cannot find module 'bluetooth_hci_socket.node'"

The native module wasn't compiled. Run:

```bash
pnpm approve-builds  # Select bluetooth packages
pnpm install
```

### "SyntaxError: invalid syntax" during build (walrus operator)

Python is too old. Set Python 3.8+:

```bash
export PYTHON=/usr/bin/python3.9
pnpm install
```

### "Can't init device hci0: Connection timed out"

Bluetooth hardware issue. Reboot the Pi first - this resolves most cases:

```bash
sudo reboot
```

If rebooting doesn't help, try:

```bash
sudo systemctl restart bluetooth
sudo hciconfig hci0 up
```

### BLE state stuck on "poweredOff"

Enable Bluetooth:

```bash
sudo hciconfig hci0 up
```

### Server not accessible from network

Check the server is running and not crashed. Test locally first:

```bash
curl http://localhost:3001/api/ruuvi
```

### Port already in use

Kill the process using the port:

```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill
```

## Running as a Service (Optional)

To run the app on boot, create a systemd service:

```bash
sudo nano /etc/systemd/system/ruuvi-dashboard.service
```

```ini
[Unit]
Description=Ruuvi Dashboard
After=network.target bluetooth.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ruuvi-dashboard
ExecStart=/usr/bin/pnpm run start:backend
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable ruuvi-dashboard
sudo systemctl start ruuvi-dashboard
```
