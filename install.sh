#!/bin/bash

# 4G Proxy Server - Manual Installation Script
# Usage: ./install.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run this script as root or with sudo"
fi

# Configuration
PROJECT_DIR=$(pwd)
SERVICE_NAME="4g-proxy-server"
DB_NAME="proxy_server"
DB_USER="proxy_user"
DB_PASSWORD=$(openssl rand -base64 32)

log "Starting 4G Proxy Server installation from current directory..."

# Step 1: System dependencies
log "Installing system dependencies..."
apt update
apt install -y curl wget git build-essential software-properties-common

# Install Node.js 20
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Step 2: Database setup
log "Setting up database..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Step 3: Install 3proxy
log "Installing 3proxy..."
cd /tmp
wget -q https://github.com/z3APA3A/3proxy/archive/3proxy-0.9.4.tar.gz
tar -xzf 3proxy-0.9.4.tar.gz
cd 3proxy-3proxy-0.9.4
make -f Makefile.Linux

mkdir -p /usr/local/3proxy/{bin,logs,stat}
cp bin/3proxy /usr/local/3proxy/bin/
cp bin/proxy /usr/local/3proxy/bin/
cp bin/socks /usr/local/3proxy/bin/

useradd -r -s /bin/false proxy3 || true
chown -R proxy3:proxy3 /usr/local/3proxy
chmod +x /usr/local/3proxy/bin/*

# Step 4: Application setup
log "Setting up application..."
cd "$PROJECT_DIR"

# Create user
adduser --system --group --home "$PROJECT_DIR" --shell /bin/bash proxy-server || true
chown -R proxy-server:proxy-server "$PROJECT_DIR"

# Install dependencies
log "Installing dependencies..."
sudo -u proxy-server npm install

# Build application
log "Building application..."
sudo -u proxy-server npm run build

# Step 5: Environment configuration
log "Creating environment file..."
cat > "$PROJECT_DIR/.env" << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
EOF

chmod 600 "$PROJECT_DIR/.env"
chown proxy-server:proxy-server "$PROJECT_DIR/.env"

# Step 6: Database migration
log "Running database migrations..."
cd "$PROJECT_DIR"
sudo -u proxy-server npm run db:push

# Step 7: Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=4G Proxy Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=proxy-server
Group=proxy-server
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
EnvironmentFile=$PROJECT_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Step 8: Configure firewall
log "Configuring firewall..."
apt install -y ufw
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
ufw allow 51000:52000/tcp

# Step 9: USB modem support
log "Installing USB modem support..."
apt install -y usb-modeswitch usb-modeswitch-data

cat > /etc/udev/rules.d/99-vodafone-m300z.rules << 'EOF'
SUBSYSTEM=="usb", ATTRS{idVendor}=="19d2", ATTRS{idProduct}=="1405", RUN+="/usr/sbin/usb_modeswitch -v 19d2 -p 1405 -J"
EOF

udevadm control --reload-rules

# Step 10: Enable IP forwarding
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p

# Step 11: Start service
log "Starting service..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Step 12: Wait and check status
sleep 5

if systemctl is-active --quiet $SERVICE_NAME; then
    log "✅ Installation completed successfully!"
    log ""
    log "Service Status: $(systemctl is-active $SERVICE_NAME)"
    log "Access: http://localhost:5000"
    log "Database: $DB_NAME (user: $DB_USER)"
    log ""
    log "Commands:"
    log "  Status: sudo systemctl status $SERVICE_NAME"
    log "  Logs: sudo journalctl -u $SERVICE_NAME -f"
    log "  Restart: sudo systemctl restart $SERVICE_NAME"
else
    error "Service failed to start. Check logs: sudo journalctl -u $SERVICE_NAME"
fi