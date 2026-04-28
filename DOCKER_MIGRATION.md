# Docker Migration Plan

## Overview

This plan containerizes the **backend server** (Express + Copilot proxy + static UI) so you can run the add-in locally via `docker compose up` without needing Node.js installed.

---

## Architecture

```
┌─────────────────────────────────────┐
│  docker-compose.yml                 │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  copilot-office (container)   │  │
│  │  - Express server (port 52390)│  │
│  │  - Copilot WebSocket proxy    │  │
│  │  - Built UI static assets     │  │
│  │  - Skills (mounted volume)    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ▼ https://localhost:52390
┌─────────────────────────────────────┐
│  Office App (Word/Excel/PowerPoint) │
│  loads add-in via manifest.xml      │
└─────────────────────────────────────┘
```

---

## What goes in the container

| Component | Path | Notes |
|---|---|---|
| Production server | `src/server-prod.js` | Entry point |
| Copilot proxy | `src/copilotProxy.js` | WebSocket bridge to GitHub Copilot |
| Built UI | `dist/` | Vite-built static assets |
| Skills | `skills/` | Mounted as volume for easy editing |
| SSL certs | `certs/` | Mounted as volume (localhost self-signed) |

## What stays outside

| Component | Reason |
|---|---|
| Electron tray app | Needs native OS access |
| `manifest.xml` registration | Client-side Office config |
| `register.sh` / `register.ps1` | Must run on host to register with Office |

---

## Migration Steps

### Step 1 — Create `Dockerfile`
### Step 2 — Create `docker-compose.yml`
### Step 3 — Create `.dockerignore`
### Step 4 — Test with `docker compose up`
### Step 5 — Register manifest as usual (`./register.sh`) on the host

---

## Usage

```bash
# Build and start (with GitHub token from gh CLI)
GITHUB_TOKEN=$(gh auth token) docker compose up --build

# Or persist via .env file
echo "GITHUB_TOKEN=$(gh auth token)" > .env
docker compose up --build

# Then register the add-in manifest on your host (one-time)
./register.sh

# Open Office and load the add-in as usual
```

The server will be available at `https://localhost:52390`.

---

## Authentication notes

Two separate auth flows are needed, both of which hit a wall because **macOS
stores credentials in the Keychain** which is inaccessible from a Linux
container:

### 1. GitHub Copilot auth

Pass a token via env var instead of relying on `~/.copilot/config.json`:

```bash
GITHUB_TOKEN=$(gh auth token) docker compose up
```

The Copilot CLI honors `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`.

### 2. Work IQ (M365) — first-time setup

The Work IQ MCP server requires:
- **EULA acceptance**
- **M365 OAuth login** (interactive device-code flow)

Both are normally stored in the macOS Keychain on your host, so they don't
transfer to the container. Instead, we authenticate **inside the container**
once and persist the result via Docker named volumes (`workiq-cli`, `workiq-net`).

On Linux there's no Keychain, so MSAL falls back to writing the token cache to
disk (`~/.work-iq-cli/msal_token_cache.dat`), which the volume preserves.

**One-time setup** (with the container running):

```bash
# 1. Accept EULA
docker compose exec copilot-office npx -y @microsoft/workiq@0.4.0 accept-eula

# 2. Trigger interactive M365 login (device-code flow)
docker compose exec copilot-office npx -y @microsoft/workiq@0.4.0 ask -q "hello"
# Follow the device-code URL and sign in with your M365 account.
```

After this, the credentials are stored in the `workiq-cli` Docker volume and
will persist across container restarts. You'll only need to redo this when
the OAuth refresh token expires (typically 90 days).

