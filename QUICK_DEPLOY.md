# Quick Deployment Guide

## 🚀 One-Time Setup (2 minutes)

1. **Create your deployment configuration:**

```bash
cp deploy.env.template deploy.env
```

2. **Edit `deploy.env` with your Raspberry Pi IP:**

```bash
nano deploy.env
```

Change the `RASP_HOST` line to your Raspberry Pi's IP address:

```bash
RASP_HOST=192.168.1.100  # Replace with your actual IP
```

That's it! 🎉

## 📦 Deploy Updates

Every time you want to deploy new code to your Raspberry Pi:

```bash
./deploy-remote.sh
```

The script will:
- ✅ Commit and push your changes to GitHub
- ✅ SSH to your Raspberry Pi
- ✅ Pull the latest code
- ✅ Install dependencies
- ✅ Restart the PM2 service
- ✅ Show you the status

## 🔍 Check Status

View logs on Raspberry Pi:

```bash
ssh aleksi@YOUR_RASPBERRY_PI_IP
pm2 logs ruuvi-dashboard
```

## 📋 What's in This Repo

- `deploy.env` - Your personal deployment config (gitignored, won't be committed)
- `deploy.env.template` - Template to copy from
- `deploy-remote.sh` - Remote deployment script (run from your Mac)
- `deploy.sh` - Local deployment script (run on Raspberry Pi)
- `DEPLOYMENT.md` - Full deployment documentation

## 🆘 Troubleshooting

**Script says "SSH configuration not found":**
- Make sure you created `deploy.env` and added your `RASP_HOST`

**Can't connect to Raspberry Pi:**
- Check your Raspberry Pi IP address: `ssh aleksi@YOUR_IP`
- Make sure SSH is enabled on your Raspberry Pi

**PM2 restart failed:**
- SSH to your Raspberry Pi and run: `pm2 status`
- If needed: `pm2 start pm2.config.js`

For more details, see [DEPLOYMENT.md](DEPLOYMENT.md)

