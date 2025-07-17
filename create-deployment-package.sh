#!/bin/bash

# Create deployment package for GitHub upload
echo "Creating deployment package for GitHub upload..."

# Create a temporary directory for the package
mkdir -p /tmp/ProProxies4gProxyServer

# Copy essential files
echo "Copying essential files..."

# Root level files
cp README.md /tmp/ProProxies4gProxyServer/
cp deploy.sh /tmp/ProProxies4gProxyServer/
cp install.sh /tmp/ProProxies4gProxyServer/
cp docker-compose.yml /tmp/ProProxies4gProxyServer/
cp Dockerfile /tmp/ProProxies4gProxyServer/
cp INSTALL.md /tmp/ProProxies4gProxyServer/
cp GITHUB_UPLOAD_INSTRUCTIONS.md /tmp/ProProxies4gProxyServer/
cp package.json /tmp/ProProxies4gProxyServer/
cp package-lock.json /tmp/ProProxies4gProxyServer/
cp .gitignore /tmp/ProProxies4gProxyServer/
cp tsconfig.json /tmp/ProProxies4gProxyServer/
cp vite.config.ts /tmp/ProProxies4gProxyServer/
cp tailwind.config.ts /tmp/ProProxies4gProxyServer/
cp postcss.config.js /tmp/ProProxies4gProxyServer/
cp components.json /tmp/ProProxies4gProxyServer/
cp drizzle.config.ts /tmp/ProProxies4gProxyServer/

# Copy directories
echo "Copying source directories..."
cp -r client /tmp/ProProxies4gProxyServer/
cp -r server /tmp/ProProxies4gProxyServer/
cp -r shared /tmp/ProProxies4gProxyServer/

# Create a tar.gz file
echo "Creating archive..."
cd /tmp
tar -czf ProProxies4gProxyServer.tar.gz ProProxies4gProxyServer/

echo "Package created at: /tmp/ProProxies4gProxyServer.tar.gz"
echo "You can download this file from the Shell tab"
echo ""
echo "Alternative: Copy individual files listed below:"
echo "============================================="
echo "Essential Files to Copy:"
echo "- README.md"
echo "- deploy.sh"
echo "- install.sh"
echo "- docker-compose.yml"
echo "- Dockerfile"
echo "- INSTALL.md"
echo "- GITHUB_UPLOAD_INSTRUCTIONS.md"
echo "- package.json"
echo "- .gitignore"
echo "- All TypeScript config files"
echo "- client/ folder (entire React app)"
echo "- server/ folder (entire Express backend)"
echo "- shared/ folder (database schema)"
echo ""
echo "Upload these to your GitHub repository at:"
echo "https://github.com/LukeyP159/ProProxies4gProxyServer"