#!/bin/bash

# 4G Proxy Server - One-Command Deployment Script
# Usage: curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/4g-proxy-server/main/deploy.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="4g-proxy-server"
INSTALL_DIR="/opt/$PROJECT_NAME"
SERVICE_NAME="4g-proxy-server"
DB_NAME="proxy_server"
DB_USER="proxy_user"
DB_PASSWORD=$(openssl rand -base64 32)
APP_PORT=5000

# Functions
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

# GitHub repository URL
REPO_URL="https://github.com/LukeyP159/ProProxies4gProxyServer.git"

# Get server domain/IP
read -p "Enter your server domain or IP address: " SERVER_DOMAIN
if [ -z "$SERVER_DOMAIN" ]; then
    warn "No domain provided, using localhost"
    SERVER_DOMAIN="localhost"
fi

log "Starting 4G Proxy Server deployment..."

# Step 1: System update and dependencies
log "Updating system packages..."
apt update && apt upgrade -y

log "Installing system dependencies..."
apt install -y curl wget git build-essential software-properties-common ufw nginx postgresql postgresql-contrib

# Step 2: Install Node.js 20
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
log "Node.js version: $node_version"
log "npm version: $npm_version"

# Step 3: Install and configure PostgreSQL
log "Configuring PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

log "Database created: $DB_NAME"

# Step 4: Install 3proxy
log "Installing 3proxy..."
cd /tmp
wget -q https://github.com/z3APA3A/3proxy/archive/3proxy-0.9.4.tar.gz
tar -xzf 3proxy-0.9.4.tar.gz
cd 3proxy-3proxy-0.9.4

# Compile 3proxy
make -f Makefile.Linux

# Install binaries
mkdir -p /usr/local/3proxy/{bin,logs,stat}
cp bin/3proxy /usr/local/3proxy/bin/
cp bin/proxy /usr/local/3proxy/bin/
cp bin/socks /usr/local/3proxy/bin/

# Create 3proxy user
useradd -r -s /bin/false proxy3 || true
chown -R proxy3:proxy3 /usr/local/3proxy
chmod +x /usr/local/3proxy/bin/*

log "3proxy installed successfully"

# Step 5: Clone and setup application
log "Cloning application from GitHub..."
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
fi

git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Create non-root user for the application
adduser --system --group --home "$INSTALL_DIR" --shell /bin/bash proxy-server || true
chown -R proxy-server:proxy-server "$INSTALL_DIR"

# Install dependencies and build
log "Installing dependencies..."
sudo -u proxy-server npm install

log "Building application..."
sudo -u proxy-server npm run build

# Step 6: Environment configuration
log "Creating environment configuration..."
cat > "$INSTALL_DIR/.env" << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
EOF

chmod 600 "$INSTALL_DIR/.env"
chown proxy-server:proxy-server "$INSTALL_DIR/.env"

# Step 7: Database setup
log "Setting up database schema..."
cd "$INSTALL_DIR"
sudo -u proxy-server npm run db:push

# Step 8: Create systemd service
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
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$INSTALL_DIR/logs
ReadWritePaths=/usr/local/3proxy/logs

[Install]
WantedBy=multi-user.target
EOF

# Step 9: Configure Nginx
log "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $SERVER_DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Main application
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }

    # Static files
    location /static {
        alias $INSTALL_DIR/dist/public;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Step 10: Configure firewall
log "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow $APP_PORT/tcp
ufw allow 51000:52000/tcp  # Proxy ports

# Step 11: Setup USB mode switching for modems
log "Configuring USB modem support..."
apt install -y usb-modeswitch usb-modeswitch-data

# Create udev rules for Vodafone M300z
cat > /etc/udev/rules.d/99-vodafone-m300z.rules << 'EOF'
# Vodafone M300z USB modem
SUBSYSTEM=="usb", ATTRS{idVendor}=="19d2", ATTRS{idProduct}=="1405", RUN+="/usr/sbin/usb_modeswitch -v 19d2 -p 1405 -J"
EOF

udevadm control --reload-rules

# Step 12: Enable IP forwarding
log "Enabling IP forwarding..."
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p

# Step 13: Create log directories
log "Setting up logging..."
mkdir -p /var/log/$PROJECT_NAME
chown proxy-server:proxy-server /var/log/$PROJECT_NAME

# Setup log rotation
cat > /etc/logrotate.d/$PROJECT_NAME << EOF
/var/log/$PROJECT_NAME/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 proxy-server proxy-server
}
EOF

# Step 14: Start services
log "Starting services..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME
systemctl reload nginx
systemctl enable nginx

# Step 15: Wait for service to start
log "Waiting for service to start..."
sleep 5

# Check service status
if systemctl is-active --quiet $SERVICE_NAME; then
    log "Service started successfully"
else
    error "Service failed to start. Check logs: sudo journalctl -u $SERVICE_NAME"
fi

# Step 16: Display completion message
log "===================================================="
log "4G Proxy Server deployment completed successfully!"
log "===================================================="
log ""
log "Access Information:"
log "  Web Interface: http://$SERVER_DOMAIN"
log "  Direct Access: http://$SERVER_DOMAIN:$APP_PORT"
log ""
log "System Information:"
log "  Installation Directory: $INSTALL_DIR"
log "  Service Name: $SERVICE_NAME"
log "  Database: $DB_NAME"
log "  Database User: $DB_USER"
log ""
log "Management Commands:"
log "  View logs: sudo journalctl -u $SERVICE_NAME -f"
log "  Restart service: sudo systemctl restart $SERVICE_NAME"
log "  Check status: sudo systemctl status $SERVICE_NAME"
log ""
log "Next Steps:"
log "  1. Connect your 4G modems via USB"
log "  2. Access the web interface to configure modems"
log "  3. Set up proxy configurations and IP rotation"
log "  4. Optional: Configure SSL with Let's Encrypt"
log ""
log "For SSL setup, run:"
log "  sudo apt install certbot python3-certbot-nginx"
log "  sudo certbot --nginx -d $SERVER_DOMAIN"
log ""
log "Database password has been saved to: $INSTALL_DIR/.env"
log "Keep this file secure and backed up!"
log ""
log "===================================================="

# Optional: Install SSL certificate
if [ "$SERVER_DOMAIN" != "localhost" ]; then
    read -p "Would you like to install SSL certificate with Let's Encrypt? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Installing SSL certificate..."
        apt install -y certbot python3-certbot-nginx
        certbot --nginx -d "$SERVER_DOMAIN" --non-interactive --agree-tos --email admin@"$SERVER_DOMAIN"
        systemctl enable certbot.timer
        log "SSL certificate installed successfully"
    fi
fi

log "Deployment complete! 🎉"