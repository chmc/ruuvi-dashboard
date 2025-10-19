# Deployment Guide

This guide explains how to deploy updates to your Ruuvi Dashboard on Raspberry Pi.

## Quick Start

### Option 1: Deploy from Your Mac to Raspberry Pi (Recommended)

This method pushes your code to GitHub and automatically deploys to your Raspberry Pi via SSH.

```bash
./deploy-remote.sh
```

The script will:
1. Check for uncommitted changes and optionally commit them
2. Push code to GitHub
3. SSH to your Raspberry Pi
4. Pull latest code
5. Install dependencies
6. Restart PM2 service

**First time setup:**

Create a `deploy.env` file with your Raspberry Pi settings:

```bash
# Copy the template
cp deploy.env.template deploy.env

# Edit with your settings
nano deploy.env
```

Update the `RASP_HOST` with your Raspberry Pi's IP address in the `deploy.env` file:

```bash
RASP_USER=aleksi
RASP_HOST=192.168.1.100  # Your actual Raspberry Pi IP
RASP_PATH=/home/aleksi/repos/ruuvi-dashboard
```

**Alternative:** You can also set environment variables in your shell:

```bash
export RASP_USER="aleksi"
export RASP_HOST="192.168.1.100"
export RASP_PATH="/home/aleksi/repos/ruuvi-dashboard"
```

Add these to your `~/.zshrc` or `~/.bashrc` to make them permanent. The script will first check for `deploy.env`, then fall back to environment variables.

### Option 2: Deploy Directly on Raspberry Pi

SSH to your Raspberry Pi and run:

```bash
cd /home/aleksi/repos/ruuvi-dashboard
./deploy.sh
```

This will:
1. Pull latest code from git
2. Install/update dependencies
3. Restart PM2 service

## Manual Deployment Steps

If you prefer to deploy manually:

```bash
# SSH to Raspberry Pi
ssh aleksi@your-raspberry-pi-ip

# Navigate to project
cd /home/aleksi/repos/ruuvi-dashboard

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart PM2
pm2 restart ruuvi-dashboard
```

## Troubleshooting

### If npm install fails on Raspberry Pi

Try with increased memory:

```bash
npm install --max-old-space-size=4096
```

Or use yarn:

```bash
npm install -g yarn
yarn install --max-old-space-size=4096
```

### If PM2 is not responding

Check PM2 status:

```bash
pm2 status
pm2 logs ruuvi-dashboard
```

Restart PM2:

```bash
pm2 restart ruuvi-dashboard
```

Or completely stop and start:

```bash
pm2 stop ruuvi-dashboard
pm2 start pm2.config.js
```

### If the Python script gets stuck

Kill stuck Python processes:

```bash
pkill -f "python3 ./scripts/ruuvi.py"
```

Then restart PM2:

```bash
pm2 restart ruuvi-dashboard
```

### Reset Bluetooth on Raspberry Pi

If you get Bluetooth errors:

```bash
sudo hciconfig hci0 reset
```

## Useful Commands

### PM2 Management

```bash
pm2 status                    # Check status
pm2 logs                      # View logs
pm2 logs ruuvi-dashboard      # View logs for specific app
pm2 monit                     # Interactive monitoring
pm2 restart ruuvi-dashboard   # Restart app
pm2 stop ruuvi-dashboard      # Stop app
pm2 start pm2.config.js       # Start app
```

### System Commands

```bash
# Check Raspberry Pi temperature
vcgencmd measure_temp

# Reboot Raspberry Pi
sudo reboot

# Shutdown Raspberry Pi
sudo shutdown -h now

# Check Bluetooth devices
python3 -m ruuvitag_sensor -f
```

## Best Practices

1. **Always test locally first** before deploying to Raspberry Pi
2. **Commit your changes** with meaningful commit messages
3. **Push to GitHub** before remote deployment
4. **Monitor logs** after deployment to ensure everything is working
5. **Keep backups** of your configuration files (`.env`, `pm2.config.js`)

## Configuration Files

Remember to update these files on your Raspberry Pi (not in git):

- `.env` - Environment variables (API keys, sensor MACs)
- `pm2.config.js` - PM2 configuration
- `start.sh` - Startup script

These files should be created from their `.template` versions and customized for your setup.

