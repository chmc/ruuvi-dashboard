# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ruuvi Dashboard is a home monitoring dashboard that displays RuuviTag sensor data (temperature, humidity, pressure) alongside weather forecasts and Finnish energy prices. It runs on Raspberry Pi with a React frontend and Express backend.

## RULES

- Always follow TDD principle when doing implementation work
- If work is from TODO.md file
  - When you start working mark task to in progress state
  - When you finish task, mark it completed

## Commands

```bash
# Development (starts both frontend and backend)
pnpm start

# Build React frontend
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Raspberry Pi deployment
./scripts/deploy.sh
```

## Architecture

### Frontend (React + MUI)

- `src/App.js` - Main component that orchestrates data fetching and renders dashboard cards
- `src/components/` - UI components for different dashboard sections (RuuviCard, EnergyPricesCard, WeatherForecastCard, etc.)
- `src/services/api.js` - API client for backend and OpenWeatherMap calls
- `src/configs.js` - Environment-based configuration (reads from `REACT_APP_*` env vars)

### Backend (Express)

- `server/index.js` - API server with endpoints for sensor data, energy prices, and temperature min/max
- `server/services/ruuvi/` - BLE scanner for RuuviTag devices using @abandonware/noble
  - `ruuviScanner.js` - BLE scanning with EventEmitter pattern
  - `ruuviParser.js` - Decodes RuuviTag data format 5 (RAWv2)
- `server/services/` - Business logic for energy prices, temperature tracking
- `server/storage.js` - JSON file-based persistence (`appStorage.json`)

### Data Flow

1. Backend scans BLE for RuuviTag advertisements (or runs simulator if `SIMULATE=true`)
2. Sensor data cached in-memory with NodeCache
3. Frontend polls `/api/ruuvi` every 10 seconds, energy/weather every 30 minutes
4. In production, Express serves built React app and proxies API calls

## Environment Variables

Copy `.env.template` to `.env` and configure:

- `REACT_APP_RUUVITAG_MACS` - Comma-separated RuuviTag MAC addresses
- `REACT_APP_RUUVITAG_NAMES` - Display names in same order as MACs
- `REACT_APP_MAIN_INDOOR_RUUVITAG_MAC` / `REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC` - Primary sensors
- `REACT_APP_OPENWEATHERMAP_APIKEY` - OpenWeatherMap API key
- `SIMULATE=true` - Run without real hardware (simulated data)
- `TEST=true` - Test mode

## Key Patterns

- JSDoc typing throughout (no TypeScript) - see `types.js` for shared type definitions
- ESLint with Airbnb config + Prettier
- MAC addresses normalized to lowercase for consistency
- Backend runs on port 3001, frontend proxied via React's dev server proxy
