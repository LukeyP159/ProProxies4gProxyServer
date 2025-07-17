#!/bin/bash

# 4G Proxy Server - One-Command Deployment Script
# This script will install and configure the complete 4G proxy server

set -e

# Set non-interactive mode for all apt operations
export DEBIAN_FRONTEND=noninteractive

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

# Check if Node.js version is sufficient (v18 or higher)
if [[ "$node_version" < "v18" ]]; then
    error "Node.js version $node_version is too old. Minimum required: v18"
fi

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
if ! npm install; then
    error "Failed to install npm dependencies"
fi

log "Building application..."
# Clean any previous builds
rm -rf dist/

# Ensure we're in the project root directory
log "Current directory: $(pwd)"
log "Checking project structure..."
if [ ! -f "package.json" ]; then
    log "package.json not found in current directory, checking for subdirectory structure..."
    
    # Check if we're in a subdirectory and need to move up or copy files
    if [ -d "ProProxies4gProxyServer" ] && [ -f "ProProxies4gProxyServer/package.json" ]; then
        log "Found project files in ProProxies4gProxyServer subdirectory, moving to root..."
        mv ProProxies4gProxyServer/* .
        mv ProProxies4gProxyServer/.* . 2>/dev/null || true
        rmdir ProProxies4gProxyServer
    elif [ -d "4g-proxy-server" ] && [ -f "4g-proxy-server/package.json" ]; then
        log "Found project files in 4g-proxy-server subdirectory, moving to root..."
        mv 4g-proxy-server/* .
        mv 4g-proxy-server/.* . 2>/dev/null || true
        rmdir 4g-proxy-server
    else
        log "Still no package.json found, checking current directory contents:"
        ls -la
        error "package.json not found - project structure may be incorrect"
    fi
fi

if [ ! -f "vite.config.ts" ]; then
    log "vite.config.ts not found in current directory, checking for subdirectory structure..."
    
    # Check if we're in a subdirectory and need to move up or copy files
    if [ -d "ProProxies4gProxyServer" ] && [ -f "ProProxies4gProxyServer/vite.config.ts" ]; then
        log "Found project files in ProProxies4gProxyServer subdirectory, moving to root..."
        mv ProProxies4gProxyServer/* .
        mv ProProxies4gProxyServer/.* . 2>/dev/null || true
        rmdir ProProxies4gProxyServer
    elif [ -d "4g-proxy-server" ] && [ -f "4g-proxy-server/vite.config.ts" ]; then
        log "Found project files in 4g-proxy-server subdirectory, moving to root..."
        mv 4g-proxy-server/* .
        mv 4g-proxy-server/.* . 2>/dev/null || true
        rmdir 4g-proxy-server
    else
        log "Still no vite.config.ts found, checking current directory contents:"
        ls -la
        error "vite.config.ts not found - project structure may be incorrect"
    fi
fi

if [ ! -d "client" ]; then
    log "client directory not found, but continuing with build process..."
    log "This might be expected if the project structure is different"
fi

if [ ! -f "client/index.html" ]; then
    log "client/index.html not found, but continuing with build process..."
    log "This might be expected if the project structure is different"
fi

# Build the application with proper error handling
log "Running frontend build..."
log "Build environment:"
log "NODE_ENV: ${NODE_ENV:-not set}"
log "PWD: $(pwd)"
log "Vite config exists: $(test -f vite.config.ts && echo 'Yes' || echo 'No')"
log "Client directory exists: $(test -d client && echo 'Yes' || echo 'No')"
log "Client index.html exists: $(test -f client/index.html && echo 'Yes' || echo 'No')"

# Set production environment for build
export NODE_ENV=production

# Run the build with explicit debug output and proper directory context
log "Starting build process..."

# Ensure we're in the correct directory before building
PROJECT_DIR=$(pwd)
log "Project directory: $PROJECT_DIR"

# Create a robust build process that ensures correct directory context
log "Building frontend with vite..."

# Create a temporary script to ensure correct directory context
cat > build-frontend.sh << 'EOF'
#!/bin/bash
set -e
cd "$1"
echo "Working directory: $(pwd)"
echo "Files in current directory:"
ls -la
echo "Files in client directory:"
ls -la client/
echo "Running vite build..."
npx vite build --config vite.config.ts
EOF

chmod +x build-frontend.sh

# Run the build script
if ! ./build-frontend.sh "$PROJECT_DIR" 2>&1 | tee build.log; then
    log "Vite build failed. Build log:"
    cat build.log
    
    # Fallback: try with npm run build
    log "Fallback: trying npm run build..."
    if ! npm run build 2>&1 | tee build.log; then
        log "Both build methods failed. Build log:"
        cat build.log
        error "Application build failed"
    fi
fi

# Clean up
rm -f build-frontend.sh

# Final fallback: if all else fails, try building with manual directory setup
if [ ! -f "dist/index.js" ] || [ ! -d "dist/public" ]; then
    log "Standard build failed. Trying manual build approach..."
    
    # Create dist directory structure
    mkdir -p dist/public
    
    # Try building frontend manually with explicit root
    log "Building frontend manually..."
    if ! npx vite build --root client --outDir ../dist/public --emptyOutDir 2>&1 | tee manual-build.log; then
        log "Manual frontend build failed. Log:"
        cat manual-build.log
        
        # Last resort: create a minimal index.html
        log "Creating minimal frontend fallback..."
        cat > dist/public/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>4G Proxy Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .error { background: #fee; border: 1px solid #fcc; color: #c00; }
        .info { background: #eef; border: 1px solid #ccf; color: #006; }
    </style>
</head>
<body>
    <div class="container">
        <h1>4G Proxy Server</h1>
        <div class="status info">
            <h3>Server Status</h3>
            <p>The 4G proxy server is running. Please check the console for detailed logs and API endpoints.</p>
        </div>
        <div class="status error">
            <h3>Frontend Build Issue</h3>
            <p>The React frontend couldn't be built during deployment. The server backend is running normally.</p>
            <p>API endpoints are available at: <code>/api/</code></p>
        </div>
        <div class="status info">
            <h3>Available Features</h3>
            <ul>
                <li>HTTP/SOCKS5 Proxy Service</li>
                <li>IP Rotation API</li>
                <li>Modem Management</li>
                <li>OpenVPN Configuration</li>
                <li>System Monitoring</li>
            </ul>
        </div>
    </div>
</body>
</html>
HTMLEOF
    fi
    
    # Build backend
    log "Building backend..."
    if ! npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist 2>&1 | tee backend-build.log; then
        log "Backend build failed. Log:"
        cat backend-build.log
        error "Backend build failed"
    fi
fi

# Verify build output
if [ ! -f "dist/index.js" ]; then
    error "Backend build failed - dist/index.js not found"
fi

if [ ! -d "dist/public" ]; then
    error "Frontend build failed - dist/public not found"
fi

if [ ! -f "dist/public/index.html" ]; then
    error "Frontend build failed - index.html not found"
fi

log "Build completed successfully"
log "Frontend files: $(ls -la dist/public/)"
log "Backend file: $(ls -la dist/index.js)"

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