# 4G Proxy Server Installation Guide - Ubuntu Server

## Prerequisites

- Ubuntu Server 22.04 LTS (recommended)
- Root or sudo access
- Internet connection
- At least 2GB RAM and 20GB disk space

## Step 1: System Update and Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required system packages
sudo apt install -y curl wget git build-essential software-properties-common

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

## Step 2: Install PostgreSQL Database

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE proxy_server;
CREATE USER proxy_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE proxy_server TO proxy_user;
ALTER USER proxy_user CREATEDB;
\q
EOF
```

## Step 3: Install 3proxy (Proxy Backend)

```bash
# Download and compile 3proxy
cd /tmp
wget https://github.com/z3APA3A/3proxy/archive/3proxy-0.9.4.tar.gz
tar -xzf 3proxy-0.9.4.tar.gz
cd 3proxy-3proxy-0.9.4

# Compile for Linux
make -f Makefile.Linux

# Install binaries
sudo mkdir -p /usr/local/3proxy/{bin,logs,stat}
sudo cp bin/3proxy /usr/local/3proxy/bin/
sudo cp bin/proxy /usr/local/3proxy/bin/
sudo cp bin/socks /usr/local/3proxy/bin/

# Create 3proxy user
sudo useradd -r -s /bin/false proxy3

# Set permissions
sudo chown -R proxy3:proxy3 /usr/local/3proxy
sudo chmod +x /usr/local/3proxy/bin/*
```

## Step 4: Clone and Setup Application

```bash
# Clone the repository
cd /opt
sudo git clone <YOUR_REPO_URL> 4g-proxy-server
cd 4g-proxy-server

# Set ownership
sudo chown -R $USER:$USER /opt/4g-proxy-server

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 5: Environment Configuration

```bash
# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://proxy_user:secure_password_here@localhost:5432/proxy_server
PGHOST=localhost
PGPORT=5432
PGUSER=proxy_user
PGPASSWORD=secure_password_here
PGDATABASE=proxy_server
EOF

# Secure the environment file
chmod 600 .env
```

## Step 6: Database Setup

```bash
# Push database schema
npm run db:push

# Verify database connection
npm run db:studio  # Optional: Opens database studio interface
```

## Step 7: System Service Configuration

### Create systemd service file

```bash
sudo tee /etc/systemd/system/4g-proxy-server.service << EOF
[Unit]
Description=4G Proxy Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/4g-proxy-server
Environment=NODE_ENV=production
EnvironmentFile=/opt/4g-proxy-server/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/4g-proxy-server/logs

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and start the service

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable 4g-proxy-server

# Start the service
sudo systemctl start 4g-proxy-server

# Check service status
sudo systemctl status 4g-proxy-server
```

## Step 8: Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/4g-proxy-server << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

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

    # WebSocket support for real-time features
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/4g-proxy-server /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # Direct access (optional)

# Allow proxy port range for 4G modems
sudo ufw allow 51000:52000/tcp

# Enable firewall
sudo ufw --force enable
```

## Step 10: 4G Modem Setup

### For Vodafone M300z modems:

```bash
# Install USB mode switching tools
sudo apt install -y usb-modeswitch usb-modeswitch-data

# Create udev rules for automatic modem detection
sudo tee /etc/udev/rules.d/99-vodafone-m300z.rules << EOF
# Vodafone M300z USB modem
SUBSYSTEM=="usb", ATTRS{idVendor}=="19d2", ATTRS{idProduct}=="1405", RUN+="/usr/sbin/usb_modeswitch -v 19d2 -p 1405 -J"
EOF

# Reload udev rules
sudo udevadm control --reload-rules
```

### Network routing for multiple modems:

```bash
# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Create routing script for multiple modems
sudo tee /usr/local/bin/setup-modem-routing.sh << 'EOF'
#!/bin/bash
# Script to configure routing for multiple 4G modems
# Each modem gets its own routing table

# Create routing tables for each modem
for i in {1..10}; do
    echo "10$i modem$i" >> /etc/iproute2/rt_tables
done

# Configure default routes (run this after modems are connected)
# ip route add default via 192.168.1.1 dev ppp0 table modem1
# ip route add default via 192.168.2.1 dev ppp1 table modem2
EOF

sudo chmod +x /usr/local/bin/setup-modem-routing.sh
```

## Step 11: SSL Certificate (Optional)

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Step 12: Monitoring and Logs

```bash
# Create log directory
sudo mkdir -p /var/log/4g-proxy-server
sudo chown $USER:$USER /var/log/4g-proxy-server

# Setup log rotation
sudo tee /etc/logrotate.d/4g-proxy-server << EOF
/var/log/4g-proxy-server/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF

# View application logs
sudo journalctl -u 4g-proxy-server -f
```

## Step 13: Usage and Access

1. **Web Interface**: Access via `http://your-server-ip:5000` or `https://your-domain.com`
2. **Default Login**: The system uses session-based authentication
3. **First Setup**: Use the "Modem Management" section to configure your 4G modems

### Two-Stage Modem Setup Process:

1. **Stage 1**: Physical connection and database registration
   - Connect M300z modem via USB
   - Register in "Modem Management" with name, APN, and auto-rotation settings

2. **Stage 2**: Port assignment and configuration
   - Assign HTTP/SOCKS5 ports
   - Configure advanced proxy settings
   - Generate OpenVPN configuration

## Troubleshooting

### Check service status:
```bash
sudo systemctl status 4g-proxy-server
sudo journalctl -u 4g-proxy-server -f
```

### Check database connection:
```bash
sudo -u postgres psql -d proxy_server -c "SELECT version();"
```

### Check 3proxy installation:
```bash
/usr/local/3proxy/bin/3proxy -h
```

### Check modem detection:
```bash
lsusb | grep -i vodafone
dmesg | grep -i usb
```

### Port conflicts:
```bash
sudo netstat -tlnp | grep :5000
sudo lsof -i :5000
```

## Security Recommendations

1. **Change default database password**
2. **Use SSL certificates in production**
3. **Configure firewall rules carefully**
4. **Regular system updates**
5. **Monitor proxy usage and logs**
6. **Use strong authentication for web interface**

## Performance Optimization

1. **Increase system limits** for high connection counts:
```bash
# Add to /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
```

2. **Optimize PostgreSQL** for your workload
3. **Configure proper backup strategy**
4. **Monitor system resources**

## Support

- Check system logs: `sudo journalctl -u 4g-proxy-server`
- Database logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
- Nginx logs: `sudo tail -f /var/log/nginx/access.log`

This installation provides a complete, production-ready 4G proxy server with all advanced features including IP rotation, OpenVPN support, and comprehensive monitoring.