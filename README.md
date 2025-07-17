# 4G Proxy Server

A comprehensive 4G proxy server solution with advanced network management capabilities. Provides robust HTTP/SOCKS5/OpenVPN support, dynamic IP rotation, and a flexible web management interface for complex proxy configurations.

## Features

- **Multi-Protocol Support**: HTTP, SOCKS5, and OpenVPN protocols
- **Dynamic IP Rotation**: Automatic and manual IP address rotation
- **Advanced Configuration**: Professional proxy settings with authentication, access control, and performance tuning
- **Real-time Monitoring**: Live dashboard with WebSocket updates
- **Modem Management**: Support for Vodafone M300z and other 4G modems
- **OpenVPN Integration**: Automatic configuration generation and management
- **3proxy Backend**: Professional HTTP and SOCKS5 proxy backend
- **Web Management Interface**: Modern React-based dashboard

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket communication
- **Proxy Backend**: 3proxy software
- **Build Tools**: Vite for frontend, ESBuild for backend

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

### Option 3: Docker Deployment

```bash
# Clone and run with Docker
git clone https://github.com/LukeyP159/ProProxies4gProxyServer.git
cd ProProxies4gProxyServer
docker-compose up -d
```

## System Requirements

- **OS**: Ubuntu 22.04 LTS (recommended)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum
- **Network**: Internet connection for initial setup
- **Hardware**: USB ports for 4G modems

## Configuration

### Environment Variables

Create a `.env` file:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/proxy_server
```

### Database Setup

The application will automatically:
1. Create the PostgreSQL database
2. Run migrations
3. Set up initial data

### Modem Configuration

1. Connect your 4G modems via USB
2. Use the web interface to configure each modem
3. Set up IP rotation and proxy settings

## Usage

### Web Interface

Access the management interface at `http://your-server:5000`

### API Endpoints

- `GET /api/modems` - List all modems
- `POST /api/modems` - Add new modem
- `PUT /api/modems/:id` - Update modem settings
- `POST /api/rotation/:id` - Rotate IP address
- `GET /api/proxy-configs` - Get proxy configurations

### Proxy Usage

```bash
# HTTP Proxy
curl -x http://username:password@your-server:51001 https://ipinfo.io

# SOCKS5 Proxy
curl --socks5 username:password@your-server:51002 https://ipinfo.io
```

## Advanced Features

### IP Rotation

- **Manual**: Click "Rotate IP" in the web interface
- **Automatic**: Configure time-based rotation
- **API**: Use REST endpoints for programmatic rotation

### OpenVPN

- Generate configurations automatically
- Download `.ovpn` files via HTTPS
- Support for multiple concurrent connections

### Access Control

- IP whitelist/blacklist
- Authentication with username/password
- Bandwidth limiting
- Connection limits

### Monitoring

- Real-time connection monitoring
- Traffic statistics
- System health monitoring
- Comprehensive logging

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Management

```bash
# Push schema changes
npm run db:push

# Open database studio
npm run db:studio
```

## Deployment

### Production Deployment

The project includes automated deployment scripts for:

- **Ubuntu Server** with systemd service
- **Docker** with Docker Compose
- **Nginx** reverse proxy configuration
- **SSL** certificate automation

### Service Management

```bash
# Check service status
sudo systemctl status 4g-proxy-server

# View logs
sudo journalctl -u 4g-proxy-server -f

# Restart service
sudo systemctl restart 4g-proxy-server
```

## Security

- Environment-based configuration
- Database connection security
- Firewall configuration
- SSL/TLS support
- User authentication
- Access control lists

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 5000, 51001+ are available
2. **Database connection**: Verify PostgreSQL is running
3. **Modem detection**: Check USB connections and drivers
4. **Permission issues**: Ensure proper file permissions

### Debug Commands

```bash
# Check service logs
sudo journalctl -u 4g-proxy-server -f

# Check database connection
npm run db:studio

# Check modem detection
lsusb | grep -i vodafone
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and support:
- Create an issue on GitHub
- Check the troubleshooting guide
- Review system logs

## Changelog

### Version 2.1.0
- Enhanced proxy configuration with 12 advanced settings
- Professional tabbed interface for port management
- Improved 3proxy integration
- Two-stage modem setup process
- Real-time monitoring enhancements