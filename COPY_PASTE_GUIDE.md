# Copy-Paste Guide for GitHub Upload

## How to Upload Your Files

1. Go to https://github.com/LukeyP159/ProProxies4gProxyServer
2. Click "Add file" → "Create new file"
3. Copy the filename and content from below
4. Paste into GitHub and click "Commit new file"
5. Repeat for each file

## Files to Copy

### 1. README.md
```
# 4G Proxy Server

A comprehensive 4G proxy server solution with advanced network management capabilities. Provides robust HTTP/SOCKS5/OpenVPN support, dynamic IP rotation, and a flexible web management interface for complex proxy configurations.

## Features

- **Multi-Protocol Support**: HTTP, SOCKS5, and OpenVPN proxy protocols
- **Dynamic IP Rotation**: Automated and manual IP rotation with Vodafone M300z support
- **Real-time Monitoring**: Live dashboard with WebSocket updates
- **Professional Configuration**: Advanced proxy settings with tabbed interface
- **Database Integration**: PostgreSQL with Drizzle ORM for persistent storage
- **3proxy Backend**: Professional proxy server with authentication and access control
- **OpenVPN Management**: Configuration generation and client management
- **System Analytics**: Usage tracking and performance metrics
- **Two-Stage Modem Setup**: Database registration followed by port assignment

## Quick Start

### Option 1: One-Command Deploy (Recommended)

```bash
# Clone and deploy in one command
curl -fsSL https://raw.githubusercontent.com/LukeyP159/ProProxies4gProxyServer/main/deploy.sh | bash
```

### Option 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/LukeyP159/ProProxies4gProxyServer.git
cd ProProxies4gProxyServer

# Run the installation script
chmod +x install.sh
sudo ./install.sh
```

## System Requirements

- Ubuntu 22.04 LTS (recommended)
- 2GB RAM minimum, 4GB recommended
- 20GB disk space
- Root access for installation
- Internet connection for dependency installation

## What Gets Installed

- **Node.js 20.x** - JavaScript runtime
- **PostgreSQL 15** - Database server
- **3proxy** - Proxy server software
- **Nginx** - Reverse proxy and SSL termination
- **OpenVPN** - VPN server software
- **USB Modem Tools** - For 4G modem management

## Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Proxy Backend**: 3proxy for HTTP/SOCKS5 services
- **Real-time Communication**: WebSocket for live updates
- **VPN**: OpenVPN server with dynamic configuration

## Configuration

After installation, access the web interface at `http://your-server-ip:5000`

### Default Credentials
- Username: `admin`
- Password: `admin123`

### Key Configuration Steps

1. **Modem Setup (Stage 1)**: Register modems with name, APN, and rotation settings
2. **Port Assignment (Stage 2)**: Assign HTTP/SOCKS5 ports and generate OpenVPN configs
3. **Proxy Configuration**: Set authentication, access control, and performance settings
4. **IP Rotation**: Configure automatic rotation schedules
5. **Analytics**: Monitor usage and performance metrics

## API Endpoints

- `GET /api/modems` - List all modems
- `POST /api/modems` - Add new modem
- `PUT /api/modems/:id/rotate` - Rotate modem IP
- `POST /api/modems/:id/reboot` - Reboot modem
- `GET /api/openvpn/configs` - List VPN configurations
- `POST /api/openvpn/generate` - Generate VPN config
- `GET /api/stats` - System statistics
- `GET /api/logs` - System logs

## Supported Modems

- **Vodafone M300z** - Full API support for IP rotation and rebooting
- **Generic 4G Modems** - Basic connectivity support
- **USB Modems** - Automatic detection and configuration

## Security Features

- Authentication and authorization
- IP-based access control
- Bandwidth limiting
- Connection limits
- SSL/TLS encryption
- Firewall configuration
- Secure credential storage

## Troubleshooting

See `INSTALL.md` for detailed installation instructions and troubleshooting guide.

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.
```

### 2. deploy.sh
```
#!/bin/bash

# 4G Proxy Server - One-Command Deployment Script
# This script will install and configure the complete 4G proxy server

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

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log "Installing system dependencies..."
apt install -y curl wget git nginx postgresql postgresql-contrib ufw fail2ban htop

# Install Node.js 20.x
log "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install 3proxy
log "Installing 3proxy..."
apt install -y 3proxy

# Clone repository
log "Cloning repository..."
cd /opt
git clone $REPO_URL
cd ProProxies4gProxyServer

# Install dependencies
log "Installing application dependencies..."
npm install

# Build application
log "Building application..."
npm run build

# Setup PostgreSQL
log "Setting up PostgreSQL database..."
sudo -u postgres createuser --createdb --pwprompt proxyuser
sudo -u postgres createdb proxyserver_db -O proxyuser

# Generate environment file
log "Creating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://proxyuser:password@localhost:5432/proxyserver_db
PGUSER=proxyuser
PGPASSWORD=password
PGDATABASE=proxyserver_db
PGHOST=localhost
PGPORT=5432
EOF

# Run database migrations
log "Running database migrations..."
npm run db:push

# Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/4g-proxy.service << EOF
[Unit]
Description=4G Proxy Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ProProxies4gProxyServer
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data /opt/ProProxies4gProxyServer
systemctl daemon-reload
systemctl enable 4g-proxy
systemctl start 4g-proxy

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/4g-proxy << EOF
server {
    listen 80;
    server_name $SERVER_DOMAIN;

    location / {
        proxy_pass http://localhost:5000;
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
        proxy_pass http://localhost:5000;
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

ln -sf /etc/nginx/sites-available/4g-proxy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Configure firewall
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 5000
ufw --force enable

# Configure USB modem detection
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
systemctl restart 4g-proxy
EOF

chmod +x /usr/local/bin/modem-connect.sh

# Final status check
log "Checking service status..."
systemctl status 4g-proxy --no-pager

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
log "For troubleshooting, check logs with: journalctl -u 4g-proxy -f"
```

### 3. install.sh
```
#!/bin/bash

# 4G Proxy Server - Manual Installation Script
# This script will install and configure the complete 4G proxy server

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run this script as root or with sudo"
fi

log "Starting 4G Proxy Server installation..."

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log "Installing system dependencies..."
apt install -y curl wget git nginx postgresql postgresql-contrib ufw fail2ban htop

# Install Node.js 20.x
log "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install 3proxy
log "Installing 3proxy..."
apt install -y 3proxy

# Install dependencies
log "Installing application dependencies..."
npm install

# Build application
log "Building application..."
npm run build

# Setup PostgreSQL
log "Setting up PostgreSQL database..."
echo "Creating database user..."
sudo -u postgres createuser --createdb --pwprompt proxyuser
sudo -u postgres createdb proxyserver_db -O proxyuser

# Generate environment file
log "Creating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://proxyuser:password@localhost:5432/proxyserver_db
PGUSER=proxyuser
PGPASSWORD=password
PGDATABASE=proxyserver_db
PGHOST=localhost
PGPORT=5432
EOF

# Run database migrations
log "Running database migrations..."
npm run db:push

# Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/4g-proxy.service << EOF
[Unit]
Description=4G Proxy Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data $(pwd)
systemctl daemon-reload
systemctl enable 4g-proxy
systemctl start 4g-proxy

# Configure Nginx
log "Configuring Nginx..."
read -p "Enter your server domain or IP address: " SERVER_DOMAIN
if [ -z "$SERVER_DOMAIN" ]; then
    SERVER_DOMAIN="localhost"
fi

cat > /etc/nginx/sites-available/4g-proxy << EOF
server {
    listen 80;
    server_name $SERVER_DOMAIN;

    location / {
        proxy_pass http://localhost:5000;
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
        proxy_pass http://localhost:5000;
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

ln -sf /etc/nginx/sites-available/4g-proxy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Configure firewall
log "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 5000
ufw --force enable

# Configure USB modem detection
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
systemctl restart 4g-proxy
EOF

chmod +x /usr/local/bin/modem-connect.sh

# Final status check
log "Checking service status..."
systemctl status 4g-proxy --no-pager

log "Installation completed successfully!"
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
log "For troubleshooting, check logs with: journalctl -u 4g-proxy -f"
```

Continue with the remaining essential files in the same way...

### Essential Files to Copy (in order):

1. **README.md** (shown above)
2. **deploy.sh** (shown above)  
3. **install.sh** (shown above)
4. **package.json** (copy from your current package.json)
5. **.gitignore** (copy from your current .gitignore)
6. **INSTALL.md** (copy from your current INSTALL.md)
7. **GITHUB_UPLOAD_INSTRUCTIONS.md** (copy from your current file)

### Source Code Folders:
- **client/** (copy entire React frontend folder)
- **server/** (copy entire Express backend folder)
- **shared/** (copy the schema.ts file)

### Configuration Files:
- **tsconfig.json**
- **vite.config.ts**
- **tailwind.config.ts**
- **postcss.config.js**
- **components.json**
- **drizzle.config.ts**

Once uploaded, users can deploy with:
```bash
curl -fsSL https://raw.githubusercontent.com/LukeyP159/ProProxies4gProxyServer/main/deploy.sh | bash
```