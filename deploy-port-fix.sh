#!/bin/bash

# Enhanced deployment script specifically for port conflict resolution
# This script addresses the EADDRINUSE error during production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Configuration
SERVICE_NAME="4g-proxy-server"
APP_PORT=5000
INSTALL_DIR="/opt/4g-proxy-server"

log "Starting Port Conflict Resolution for 4G Proxy Server"

# Step 1: Stop all services and processes using port 5000
log "Stopping all services and processes on port $APP_PORT..."

# Stop the systemd service
systemctl stop $SERVICE_NAME 2>/dev/null || true
systemctl disable $SERVICE_NAME 2>/dev/null || true

# Kill processes by name
pkill -f "tsx server/index.ts" || true
pkill -f "node dist/index.js" || true
pkill -f "4g-proxy-server" || true

# Kill processes using port 5000
fuser -k $APP_PORT/tcp 2>/dev/null || true
fuser -k $APP_PORT/udp 2>/dev/null || true

# More aggressive port cleanup
lsof -ti:$APP_PORT | xargs kill -9 2>/dev/null || true

# Wait for processes to terminate
sleep 5

# Step 2: Verify port is free
log "Verifying port $APP_PORT is available..."
if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "Port $APP_PORT is still in use. Attempting more aggressive cleanup..."
    
    # Get process details
    lsof -Pi :$APP_PORT -sTCP:LISTEN
    
    # Force kill all processes on port
    lsof -ti:$APP_PORT | xargs kill -9 2>/dev/null || true
    sleep 3
    
    # Final check
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        error "Unable to free port $APP_PORT. Please manually kill processes and try again."
    fi
fi

log "Port $APP_PORT is now available"

# Step 3: Navigate to install directory
cd $INSTALL_DIR || error "Install directory $INSTALL_DIR not found"

# Step 4: Update environment variables
log "Updating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://proxy_user:proxy_password@localhost:5432/proxy_db
PGUSER=proxy_user
PGPASSWORD=proxy_password
PGDATABASE=proxy_db
PGHOST=localhost
PGPORT=5432
EOF

# Step 5: Test database connection
log "Testing database connection..."
if ! PGPASSWORD=proxy_password psql -h localhost -U proxy_user -d proxy_db -c '\q' 2>/dev/null; then
    warn "Database connection failed. Attempting to restart PostgreSQL..."
    systemctl restart postgresql
    sleep 3
    
    if ! PGPASSWORD=proxy_password psql -h localhost -U proxy_user -d proxy_db -c '\q' 2>/dev/null; then
        error "Database connection still failing. Please check PostgreSQL configuration."
    fi
fi

# Step 6: Update systemd service with better error handling
log "Updating systemd service configuration..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=4G Proxy Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$INSTALL_DIR
ExecStartPre=/bin/sleep 5
ExecStartPre=/bin/bash -c 'fuser -k $APP_PORT/tcp || true'
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Step 7: Set proper permissions
log "Setting proper permissions..."
chown -R www-data:www-data $INSTALL_DIR
chmod +x $INSTALL_DIR/dist/index.js

# Step 8: Reload systemd and start service
log "Reloading systemd and starting service..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME

# Final port check before starting
if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    error "Port $APP_PORT is occupied again. Cannot start service."
fi

systemctl start $SERVICE_NAME

# Step 9: Wait and check service status
log "Waiting for service to start..."
sleep 10

# Check if service is running
if systemctl is-active --quiet $SERVICE_NAME; then
    log "Service started successfully!"
    systemctl status $SERVICE_NAME --no-pager
else
    error "Service failed to start. Checking logs..."
fi

# Step 10: Test application endpoint
log "Testing application endpoint..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT/api/health | grep -q "200\|404"; then
    log "Application is responding on port $APP_PORT"
else
    warn "Application may not be fully ready yet. Check logs with: journalctl -u $SERVICE_NAME -f"
fi

log "Port conflict resolution completed successfully!"
log "Service status: $(systemctl is-active $SERVICE_NAME)"
log "Access your application at: http://localhost:$APP_PORT"