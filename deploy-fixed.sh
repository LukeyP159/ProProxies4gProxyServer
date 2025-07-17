#!/bin/bash

# 4G Proxy Server - One-Command Deployment Script
# This script will install and configure the complete 4G proxy server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Auto-detect server IP or use localhost
SERVER_DOMAIN=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
if [ "$SERVER_DOMAIN" = "localhost" ]; then
    warn "Could not detect public IP, using localhost"
else
    log "Detected server IP: $SERVER_DOMAIN"
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

# Step 4: Clone repository
log "Cloning repository..."
cd /opt
if [ -d "$PROJECT_NAME" ]; then
    rm -rf "$PROJECT_NAME"
fi
git clone $REPO_URL $PROJECT_NAME
cd $PROJECT_NAME

# Step 5: Install dependencies and build
log "Installing application dependencies..."
npm install

log "Building application..."
npm run build

# Step 6: Create environment file
log "Creating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME
PGHOST=localhost
PGPORT=5432
EOF

# Step 7: Run database migrations
log "Running database migrations..."
npm run db:push

# Step 8: Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=4G Proxy Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Step 9: Set permissions and start service
log "Setting permissions..."
chown -R www-data:www-data $INSTALL_DIR
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Step 10: Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/$SERVICE_NAME << EOF
server {
    listen 80;
    server_name $SERVER_DOMAIN;

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
    }

    location /ws {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Step 11: Configure firewall
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow $APP_PORT
ufw --force enable

# Step 12: Configure USB modem detection
log "Setting up USB modem detection..."
cat > /etc/udev/rules.d/99-usb-modems.rules << EOF
SUBSYSTEM=="tty", ATTRS{idVendor}=="12d1", ATTRS{idProduct}=="1506", SYMLINK+="ttyUSB_modem"
SUBSYSTEM=="usb", ATTRS{idVendor}=="12d1", ATTRS{idProduct}=="1506", RUN+="/usr/local/bin/modem-connect.sh"
EOF

udevadm control --reload-rules

# Create modem connection script
cat > /usr/local/bin/modem-connect.sh << 'EOF'
#!/bin/bash
# Modem connection script
logger "USB modem connected: $1"
systemctl restart 4g-proxy-server
EOF

chmod +x /usr/local/bin/modem-connect.sh

# Step 13: Final status check
log "Checking service status..."
systemctl status $SERVICE_NAME --no-pager

log "Deployment completed successfully!"
log ""
log "Access your 4G Proxy Server at: http://$SERVER_DOMAIN"
log "Default credentials: admin / admin123"
log ""
log "Next steps:"
log "1. Change default password"
log "2. Configure your 4G modems"
log "3. Set up proxy configurations"
log "4. Test IP rotation functionality"
log ""
log "For troubleshooting, check logs with: journalctl -u $SERVICE_NAME -f"