#!/bin/bash

# GitHub Upload Script for ProProxies4gProxyServer
# This script will prepare and upload your project to GitHub

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log "Initializing git repository..."
    git init
fi

# Check if git is configured
if ! git config user.name >/dev/null 2>&1; then
    read -p "Enter your Git username: " git_username
    git config user.name "$git_username"
fi

if ! git config user.email >/dev/null 2>&1; then
    read -p "Enter your Git email: " git_email
    git config user.email "$git_email"
fi

# Add remote origin if not exists
if ! git remote get-url origin >/dev/null 2>&1; then
    log "Adding GitHub repository as remote origin..."
    git remote add origin https://github.com/LukeyP159/ProProxies4gProxyServer.git
else
    log "Remote origin already exists"
fi

# Stage all files
log "Staging files for commit..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    warn "No changes to commit"
else
    log "Committing changes..."
    git commit -m "Complete 4G proxy server with advanced features

- Professional proxy configuration editor with tabbed interface
- 3proxy integration for HTTP/SOCKS5 proxy backend
- Two-stage modem setup process (registration + port assignment)
- Real-time monitoring with WebSocket communication
- OpenVPN configuration generation and management
- Comprehensive Ubuntu Server installation scripts
- Docker deployment support
- Advanced proxy settings (authentication, access control, performance)
- IP rotation and modem management for Vodafone M300z
- Modern React TypeScript frontend with Tailwind CSS
- Express.js backend with PostgreSQL database"
fi

# Push to GitHub
log "Pushing to GitHub..."
git branch -M main
git push -u origin main

log "✅ Successfully uploaded to GitHub!"
log ""
log "Repository: https://github.com/LukeyP159/ProProxies4gProxyServer"
log ""
log "Now you can deploy on your Ubuntu server using:"
log "curl -fsSL https://raw.githubusercontent.com/LukeyP159/ProProxies4gProxyServer/main/deploy.sh | bash"
log ""
log "Or clone and install manually:"
log "git clone https://github.com/LukeyP159/ProProxies4gProxyServer.git"
log "cd ProProxies4gProxyServer"
log "chmod +x install.sh && sudo ./install.sh"