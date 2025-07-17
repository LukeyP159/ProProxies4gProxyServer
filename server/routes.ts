import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { proxyManager } from "./proxy-manager";
import { insertModemSchema, insertVpnConnectionSchema, insertIpRotationLogSchema, insertSystemLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);
      } catch (error) {
        console.error('Invalid JSON received:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Dashboard stats endpoint
  app.get('/api/stats', async (req, res) => {
    try {
      const modems = await storage.getModems();
      const vpnConnections = await storage.getVpnConnections();
      const ipRotationLogs = await storage.getIpRotationLogs(24);
      
      const activeModems = modems.filter(m => m.status === 'connected').length;
      const totalBandwidth = modems.reduce((sum, m) => sum + (m.downloadSpeed || 0), 0);
      const totalRotations = ipRotationLogs.length;
      const activeVpnConnections = vpnConnections.filter(v => v.status === 'active').length;
      
      res.json({
        activeModems,
        totalBandwidth,
        totalRotations,
        activeVpnConnections
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Modem endpoints
  app.get('/api/modems', async (req, res) => {
    try {
      const modems = await storage.getModems();
      res.json(modems);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch modems' });
    }
  });

  app.get('/api/modems/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }
      res.json(modem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch modem' });
    }
  });

  app.post('/api/modems', async (req, res) => {
    try {
      const validatedData = insertModemSchema.parse(req.body);
      const modem = await storage.createModem(validatedData);
      
      // Log the creation
      await storage.createSystemLog({
        level: 'info',
        message: `New modem ${modem.name} added`,
        details: `IMEI: ${modem.imei}`,
        source: 'modem',
        sourceId: modem.id
      });
      
      broadcast({ type: 'modem_created', data: modem });
      res.json(modem);
    } catch (error) {
      res.status(400).json({ error: 'Invalid modem data' });
    }
  });

  app.put('/api/modems/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const modem = await storage.updateModem(id, updates);
      
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }
      
      broadcast({ type: 'modem_updated', data: modem });
      res.json(modem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update modem' });
    }
  });

  app.delete('/api/modems/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteModem(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Modem not found' });
      }
      
      broadcast({ type: 'modem_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete modem' });
    }
  });

  // IP rotation endpoint
  app.post('/api/modems/:id/rotate-ip', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }

      // Import the modem controller
      const { ModemControllerFactory } = await import('./modem-controller');
      const controller = ModemControllerFactory.create(modem);
      
      // Perform IP rotation
      const result = await controller.rotateIp();
      
      // Log the rotation attempt
      await storage.createIpRotationLog({
        modemId: id,
        oldIp: result.oldIp || null,
        newIp: result.newIp || null,
        success: result.success || false,
        error: result.error || null
      });

      // Log system event
      await storage.createSystemLog({
        level: result.success ? 'info' : 'error',
        message: `IP rotation ${result.success ? 'successful' : 'failed'} for modem ${modem.name}`,
        source: 'modem-controller',
        sourceId: id,
        details: result.error || null
      });

      // Update modem status if successful
      if (result.success && result.newIp) {
        await storage.updateModem(id, {
          publicIp: result.newIp,
          lastSeen: new Date()
        });
      }

      broadcast({ type: 'modem_updated', data: modem });
      res.json(result);
    } catch (error) {
      console.error('IP rotation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reboot endpoint
  app.post('/api/modems/:id/reboot', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }

      // Import the modem controller
      const { ModemControllerFactory } = await import('./modem-controller');
      const controller = ModemControllerFactory.create(modem);
      
      // Set status to rebooting
      await storage.updateModem(id, {
        status: 'rebooting',
        lastReboot: new Date()
      });

      // Perform reboot
      const result = await controller.reboot();
      
      // Log system event
      await storage.createSystemLog({
        level: result.success ? 'info' : 'error',
        message: `Modem reboot ${result.success ? 'initiated' : 'failed'} for ${modem.name}`,
        source: 'modem-controller',
        sourceId: id,
        details: result.error || null
      });

      // Update status based on result
      await storage.updateModem(id, {
        status: result.success ? 'rebooting' : 'error',
        lastSeen: new Date()
      });

      broadcast({ type: 'modem_updated', data: modem });
      res.json(result);
    } catch (error) {
      console.error('Reboot error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Keep the old rotate endpoint for backward compatibility
  app.post('/api/modems/:id/rotate', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }
      
      // Simulate IP rotation (in real implementation, this would trigger actual rotation)
      const oldIp = modem.publicIp;
      const newIp = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
      
      // Update modem with new IP
      await storage.updateModem(id, { publicIp: newIp });
      
      // Log the rotation
      await storage.createIpRotationLog({
        modemId: id,
        oldIp,
        newIp,
        success: true
      });
      
      await storage.createSystemLog({
        level: 'info',
        message: `${modem.name} IP rotated successfully`,
        details: `New IP: ${newIp}`,
        source: 'modem',
        sourceId: id
      });
      
      broadcast({ type: 'ip_rotated', data: { modemId: id, oldIp, newIp } });
      res.json({ success: true, oldIp, newIp });
    } catch (error) {
      res.status(500).json({ error: 'Failed to rotate IP' });
    }
  });

  // VPN endpoints
  app.get('/api/vpn/connections', async (req, res) => {
    try {
      const connections = await storage.getVpnConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch VPN connections' });
    }
  });

  app.post('/api/vpn/generate', async (req, res) => {
    try {
      const { modemId, clientName } = req.body;
      
      if (!modemId || !clientName) {
        return res.status(400).json({ error: 'modemId and clientName required' });
      }
      
      const modem = await storage.getModem(modemId);
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }
      
      const connection = await storage.createVpnConnection({
        modemId,
        clientName,
        configPath: `/etc/openvpn/${clientName}.conf`,
        status: 'active',
        connectedAt: new Date()
      });
      
      await storage.createSystemLog({
        level: 'info',
        message: `OpenVPN config generated for ${modem.name}`,
        details: `Client: ${clientName}`,
        source: 'vpn',
        sourceId: modemId
      });
      
      broadcast({ type: 'vpn_connection_created', data: connection });
      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate VPN config' });
    }
  });

  // System logs endpoint
  app.get('/api/logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getSystemLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // IP rotation logs endpoint
  app.get('/api/rotation-logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getIpRotationLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rotation logs' });
    }
  });

  // Proxy configurations endpoint
  app.get('/api/proxy-configs', async (req, res) => {
    try {
      const configs = await storage.getProxyConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch proxy configurations' });
    }
  });

  // Assign ports to modem (Stage 2)
  app.post('/api/modems/:id/assign-ports', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { httpPort, socksPort, authentication, username, password } = req.body;
      
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: 'Modem not found' });
      }

      // Create proxy configuration
      const proxyConfig = await storage.createProxyConfiguration({
        modemId: id,
        httpPort,
        socksPort,
        authentication,
        username,
        password,
        isActive: true
      });

      // Generate OpenVPN configuration
      const openvpnConfigPath = `/configs/openvpn/${modem.name}-${modem.imei}.ovpn`;
      const openvpnConfigUrl = `https://${req.get('host')}/download/openvpn/${modem.name}-${modem.imei}.ovpn`;

      // Update modem with Stage 2 configuration
      await storage.updateModem(id, {
        portsAssigned: true,
        openvpnConfigPath,
        openvpnConfigUrl
      });

      // Create VPN connection entry
      await storage.createVpnConnection({
        modemId: id,
        clientName: `${modem.name}-default`,
        configPath: openvpnConfigPath,
        status: 'active',
        connectedAt: new Date()
      });

      // Update 3proxy configuration with new ports
      const allModems = await storage.getModems();
      const allProxyConfigs = await storage.getProxyConfigurations();
      await proxyManager.updateConfiguration(allModems, allProxyConfigs);

      await storage.createSystemLog({
        level: 'info',
        message: `Ports assigned to ${modem.name} - HTTP: ${httpPort}, SOCKS: ${socksPort}`,
        details: `OpenVPN config available at: ${openvpnConfigUrl}. 3proxy updated with new configuration.`,
        source: 'modem-management',
        sourceId: id
      });

      broadcast({ type: 'modem_ports_assigned', data: { modemId: id, proxyConfig } });
      res.json({ success: true, proxyConfig, openvpnConfigUrl });
    } catch (error) {
      console.error('Port assignment error:', error);
      res.status(500).json({ error: 'Failed to assign ports' });
    }
  });

  // Download OpenVPN configuration
  app.get('/download/openvpn/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const [modemName, imei] = filename.replace('.ovpn', '').split('-');
      
      const modem = await storage.getModemByName(modemName);
      if (!modem || !modem.openvpnConfigPath) {
        return res.status(404).json({ error: 'OpenVPN configuration not found' });
      }

      // Generate OpenVPN configuration content
      const config = generateOpenVPNConfig(modem);
      
      res.setHeader('Content-Type', 'application/x-openvpn-profile');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(config);
    } catch (error) {
      console.error('OpenVPN download error:', error);
      res.status(500).json({ error: 'Failed to download OpenVPN configuration' });
    }
  });

  function generateOpenVPNConfig(modem: any): string {
    const config = `client
dev tun
proto udp
remote ${modem.publicIp || 'your-server-ip'} 1194
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert ${modem.name}.crt
key ${modem.name}.key
cipher AES-256-CBC
auth SHA256
comp-lzo
verb 3

# Client configuration for ${modem.name}
# IMEI: ${modem.imei}
# Generated: ${new Date().toISOString()}

# Route all traffic through VPN
redirect-gateway def1 bypass-dhcp

# DNS servers
dhcp-option DNS 8.8.8.8
dhcp-option DNS 8.8.4.4

# Keep alive
keepalive 10 120
`;
    return config;
  }

  // Analytics endpoint
  app.get('/api/analytics', async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // 3proxy management endpoints
  app.get('/api/proxy/status', async (req, res) => {
    try {
      const status = await proxyManager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get proxy status' });
    }
  });

  app.post('/api/proxy/start', async (req, res) => {
    try {
      await proxyManager.start();
      res.json({ success: true, message: '3proxy started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start 3proxy' });
    }
  });

  app.post('/api/proxy/stop', async (req, res) => {
    try {
      await proxyManager.stop();
      res.json({ success: true, message: '3proxy stopped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop 3proxy' });
    }
  });

  app.post('/api/proxy/restart', async (req, res) => {
    try {
      await proxyManager.restart();
      res.json({ success: true, message: '3proxy restarted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to restart 3proxy' });
    }
  });

  app.get('/api/proxy/logs', async (req, res) => {
    try {
      const lines = parseInt(req.query.lines as string) || 100;
      const logs = await proxyManager.getLogs(lines);
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get proxy logs' });
    }
  });

  app.post('/api/proxy/test/:port', async (req, res) => {
    try {
      const port = parseInt(req.params.port);
      const type = req.body.type || 'http';
      const result = await proxyManager.testProxy(port, type);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to test proxy' });
    }
  });

  // Proxy configuration endpoints
  app.get('/api/proxy/configurations', async (req, res) => {
    try {
      const configs = await storage.getProxyConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch proxy configurations' });
    }
  });

  return httpServer;
}
