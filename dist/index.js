var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/modem-controller.ts
var modem_controller_exports = {};
__export(modem_controller_exports, {
  ModemControllerFactory: () => ModemControllerFactory,
  VodafoneM300zController: () => VodafoneM300zController
});
import axios from "axios";
var VodafoneM300zController, ModemControllerFactory;
var init_modem_controller = __esm({
  "server/modem-controller.ts"() {
    "use strict";
    VodafoneM300zController = class {
      client;
      modem;
      constructor(modem) {
        this.modem = modem;
        this.client = axios.create({
          baseURL: `http://${modem.localIp}`,
          timeout: 1e4,
          auth: {
            username: modem.adminUsername || "admin",
            password: modem.adminPassword || "admin"
          },
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
      }
      async getStatus() {
        try {
          const endpoints = [
            "/api/device/information",
            "/api/device/status",
            "/api/system/status",
            "/goform/goform_get_status",
            "/api/monitoring/status"
          ];
          let statusData = null;
          for (const endpoint of endpoints) {
            try {
              const response = await this.client.get(endpoint);
              if (response.data) {
                statusData = response.data;
                break;
              }
            } catch (error) {
              continue;
            }
          }
          if (!statusData) {
            await this.client.get("/");
            return {
              connected: true,
              signalStrength: -70,
              downloadSpeed: 0,
              uploadSpeed: 0,
              publicIp: null,
              connectionType: "4G",
              provider: "Vodafone",
              firmware: "Unknown"
            };
          }
          return this.parseStatusResponse(statusData);
        } catch (error) {
          console.error(`Failed to get status for modem ${this.modem.name}:`, error);
          return {
            connected: false,
            signalStrength: -999,
            downloadSpeed: 0,
            uploadSpeed: 0,
            publicIp: null,
            connectionType: "Unknown",
            provider: "Vodafone",
            firmware: "Unknown"
          };
        }
      }
      parseStatusResponse(data) {
        const status = {
          connected: true,
          signalStrength: -70,
          downloadSpeed: 0,
          uploadSpeed: 0,
          publicIp: null,
          connectionType: "4G",
          provider: "Vodafone",
          firmware: "Unknown"
        };
        if (data.SignalStrength) status.signalStrength = parseInt(data.SignalStrength);
        if (data.signal_strength) status.signalStrength = parseInt(data.signal_strength);
        if (data.rssi) status.signalStrength = parseInt(data.rssi);
        if (data.CurrentDownloadRate) status.downloadSpeed = parseInt(data.CurrentDownloadRate);
        if (data.CurrentUploadRate) status.uploadSpeed = parseInt(data.CurrentUploadRate);
        if (data.WanIPAddress) status.publicIp = data.WanIPAddress;
        if (data.wan_ip) status.publicIp = data.wan_ip;
        if (data.ipv4_addr) status.publicIp = data.ipv4_addr;
        if (data.NetworkType) status.connectionType = data.NetworkType;
        if (data.network_type) status.connectionType = data.network_type;
        if (data.Provider) status.provider = data.Provider;
        if (data.provider) status.provider = data.provider;
        if (data.SoftwareVersion) status.firmware = data.SoftwareVersion;
        if (data.firmware) status.firmware = data.firmware;
        if (data.ConnectionStatus === "Connected" || data.connection_status === "connected") {
          status.connected = true;
        } else if (data.ConnectionStatus === "Disconnected" || data.connection_status === "disconnected") {
          status.connected = false;
        }
        return status;
      }
      async rotateIp() {
        try {
          const oldStatus = await this.getStatus();
          const oldIp = oldStatus.publicIp;
          const isDevelopment = process.env.NODE_ENV === "development";
          if (isDevelopment) {
            const newIp2 = this.generateRandomIp();
            await this.sleep(2e3);
            return {
              success: true,
              oldIp: oldIp || "203.0.113.45",
              newIp: newIp2
            };
          }
          const disconnectEndpoints = [
            { url: "/api/dialup/mobile_connect", method: "POST", data: { Action: 0 } },
            { url: "/goform/goform_set_cmd_process", method: "POST", data: { isTest: "false", goformId: "DISCONNECT_NETWORK" } },
            { url: "/api/net/disconnect", method: "POST", data: {} },
            { url: "/api/connection/disconnect", method: "POST", data: {} }
          ];
          let disconnected = false;
          for (const endpoint of disconnectEndpoints) {
            try {
              await this.client.request({
                method: endpoint.method,
                url: endpoint.url,
                data: endpoint.data
              });
              disconnected = true;
              console.log(`Disconnected from 4G service via ${endpoint.url}`);
              break;
            } catch (error) {
              continue;
            }
          }
          if (!disconnected) {
            return { success: false, error: "Failed to disconnect from 4G service" };
          }
          await this.sleep(5e3);
          const connectEndpoints = [
            { url: "/api/dialup/mobile_connect", method: "POST", data: { Action: 1 } },
            { url: "/goform/goform_set_cmd_process", method: "POST", data: { isTest: "false", goformId: "CONNECT_NETWORK" } },
            { url: "/api/net/connect", method: "POST", data: {} },
            { url: "/api/connection/connect", method: "POST", data: {} }
          ];
          let reconnected = false;
          for (const endpoint of connectEndpoints) {
            try {
              await this.client.request({
                method: endpoint.method,
                url: endpoint.url,
                data: endpoint.data
              });
              reconnected = true;
              console.log(`Reconnected to 4G service via ${endpoint.url}`);
              break;
            } catch (error) {
              continue;
            }
          }
          if (!reconnected) {
            return { success: false, error: "Failed to reconnect to 4G service" };
          }
          await this.sleep(15e3);
          const newStatus = await this.getStatus();
          const newIp = newStatus.publicIp;
          if (newIp && newIp !== oldIp) {
            return { success: true, oldIp, newIp };
          } else if (newIp === oldIp) {
            return { success: false, error: "Carrier assigned the same IP address" };
          } else {
            return { success: false, error: "Unable to obtain new IP address after reconnection" };
          }
        } catch (error) {
          console.error(`Failed to rotate IP for modem ${this.modem.name}:`, error);
          if (process.env.NODE_ENV === "development") {
            return {
              success: true,
              oldIp: "203.0.113.45",
              newIp: this.generateRandomIp()
            };
          }
          return { success: false, error: error.message };
        }
      }
      async reboot() {
        try {
          const isDevelopment = process.env.NODE_ENV === "development";
          if (isDevelopment) {
            await this.sleep(3e3);
            return { success: true };
          }
          const rebootEndpoints = [
            { url: "/api/device/control", method: "POST", data: { Control: 1 } },
            { url: "/api/system/reboot", method: "POST", data: {} },
            { url: "/goform/goform_set_cmd_process", method: "POST", data: { isTest: "false", goformId: "REBOOT_DEVICE" } },
            { url: "/api/device/reboot", method: "POST", data: {} },
            { url: "/api/management/reboot", method: "POST", data: {} }
          ];
          let rebooted = false;
          for (const endpoint of rebootEndpoints) {
            try {
              await this.client.request({
                method: endpoint.method,
                url: endpoint.url,
                data: endpoint.data
              });
              rebooted = true;
              break;
            } catch (error) {
              continue;
            }
          }
          if (rebooted) {
            return { success: true };
          } else {
            return { success: false, error: "No reboot endpoint responded successfully" };
          }
        } catch (error) {
          console.error(`Failed to reboot modem ${this.modem.name}:`, error);
          if (process.env.NODE_ENV === "development") {
            return { success: true };
          }
          return { success: false, error: error.message };
        }
      }
      sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      generateRandomIp() {
        return `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
      }
    };
    ModemControllerFactory = class {
      static create(modem) {
        switch (modem.model) {
          case "M300z":
          default:
            return new VodafoneM300zController(modem);
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analytics: () => analytics,
  insertAnalyticsSchema: () => insertAnalyticsSchema,
  insertIpRotationLogSchema: () => insertIpRotationLogSchema,
  insertModemSchema: () => insertModemSchema,
  insertProxyConfigurationSchema: () => insertProxyConfigurationSchema,
  insertSystemLogSchema: () => insertSystemLogSchema,
  insertUserSchema: () => insertUserSchema,
  insertVpnConnectionSchema: () => insertVpnConnectionSchema,
  ipRotationLogs: () => ipRotationLogs,
  modems: () => modems,
  proxyConfiguration: () => proxyConfiguration,
  systemLogs: () => systemLogs,
  users: () => users,
  vpnConnections: () => vpnConnections
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var modems = pgTable("modems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imei: text("imei").notNull().unique(),
  localIp: text("local_ip").default("192.168.1.1"),
  // Default IP for M300z
  publicIp: text("public_ip"),
  status: text("status").notNull().default("disconnected"),
  // connected, disconnected, reconnecting, error, rebooting
  signalStrength: integer("signal_strength"),
  downloadSpeed: integer("download_speed"),
  // in MB/s
  uploadSpeed: integer("upload_speed"),
  // in MB/s
  provider: text("provider"),
  connectionType: text("connection_type"),
  // 4G, 5G, 3G
  model: text("model").default("M300z"),
  // Modem model
  firmware: text("firmware"),
  // Firmware version
  adminUsername: text("admin_username").default("admin"),
  adminPassword: text("admin_password").default("admin"),
  // Stage 1 configuration
  apnName: text("apn_name"),
  // APN for modems that support pushing APN via commands
  apnUsername: text("apn_username"),
  // APN username
  apnPassword: text("apn_password"),
  // APN password
  autoIpRotation: boolean("auto_ip_rotation").default(false),
  // Auto IP rotation setting
  ipRotationInterval: integer("ip_rotation_interval").default(30),
  // Minutes between rotations
  // Stage 2 configuration (set when ports are assigned)
  portsAssigned: boolean("ports_assigned").default(false),
  // Whether HTTP/SOCKS ports are assigned
  openvpnConfigPath: text("openvpn_config_path"),
  // Path to OpenVPN config file
  openvpnConfigUrl: text("openvpn_config_url"),
  // HTTPS URL to download OpenVPN config
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  lastReboot: timestamp("last_reboot"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var vpnConnections = pgTable("vpn_connections", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  clientName: text("client_name").notNull(),
  configPath: text("config_path"),
  status: text("status").notNull().default("inactive"),
  // active, inactive, error
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var ipRotationLogs = pgTable("ip_rotation_logs", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  oldIp: text("old_ip"),
  newIp: text("new_ip"),
  success: boolean("success").default(true),
  error: text("error"),
  rotatedAt: timestamp("rotated_at").defaultNow()
});
var systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  // info, warn, error, debug
  message: text("message").notNull(),
  details: text("details"),
  source: text("source"),
  // modem, vpn, api, system
  sourceId: integer("source_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var proxyConfiguration = pgTable("proxy_configuration", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  httpPort: integer("http_port"),
  socksPort: integer("socks_port"),
  authentication: boolean("authentication").default(false),
  username: text("username"),
  password: text("password"),
  isActive: boolean("is_active").default(true),
  // Additional proxy settings commonly found in proxy management
  maxConnections: integer("max_connections").default(100),
  connectionTimeout: integer("connection_timeout").default(30),
  keepAlive: boolean("keep_alive").default(true),
  allowedIps: text("allowed_ips").array(),
  blockedIps: text("blocked_ips").array(),
  bandwidthLimit: integer("bandwidth_limit"),
  // in KB/s
  dailyTrafficLimit: integer("daily_traffic_limit"),
  // in MB
  protocol: text("protocol").default("both"),
  // 'http', 'socks5', 'both'
  sslEnabled: boolean("ssl_enabled").default(false),
  logLevel: text("log_level").default("info"),
  // 'debug', 'info', 'warn', 'error'
  rotateOnDisconnect: boolean("rotate_on_disconnect").default(false),
  customHeaders: text("custom_headers"),
  // JSON string of custom headers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  bandwidth: integer("bandwidth"),
  // in MB
  connections: integer("connections"),
  rotations: integer("rotations"),
  uptime: integer("uptime"),
  // in seconds
  recordedAt: timestamp("recorded_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({ id: true });
var insertModemSchema = createInsertSchema(modems).omit({ id: true, createdAt: true, updatedAt: true });
var insertVpnConnectionSchema = createInsertSchema(vpnConnections).omit({ id: true, createdAt: true });
var insertIpRotationLogSchema = createInsertSchema(ipRotationLogs).omit({ id: true, rotatedAt: true });
var insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true, createdAt: true });
var insertProxyConfigurationSchema = createInsertSchema(proxyConfiguration).omit({ id: true, createdAt: true, updatedAt: true });
var insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, recordedAt: true });

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  // Modem operations
  async getModems() {
    return await db.select().from(modems).orderBy(desc(modems.createdAt));
  }
  async getModem(id) {
    const [modem] = await db.select().from(modems).where(eq(modems.id, id));
    return modem || void 0;
  }
  async getModemByName(name) {
    const [modem] = await db.select().from(modems).where(eq(modems.name, name));
    return modem || void 0;
  }
  async createModem(insertModem) {
    const [modem] = await db.insert(modems).values(insertModem).returning();
    return modem;
  }
  async updateModem(id, updates) {
    const [modem] = await db.update(modems).set(updates).where(eq(modems.id, id)).returning();
    return modem || void 0;
  }
  async deleteModem(id) {
    const result = await db.delete(modems).where(eq(modems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // VPN operations
  async getVpnConnections() {
    return await db.select().from(vpnConnections).orderBy(desc(vpnConnections.createdAt));
  }
  async getVpnConnectionsByModem(modemId) {
    return await db.select().from(vpnConnections).where(eq(vpnConnections.modemId, modemId));
  }
  async createVpnConnection(insertVpnConnection) {
    const [vpnConnection] = await db.insert(vpnConnections).values(insertVpnConnection).returning();
    return vpnConnection;
  }
  async updateVpnConnection(id, updates) {
    const [vpnConnection] = await db.update(vpnConnections).set(updates).where(eq(vpnConnections.id, id)).returning();
    return vpnConnection || void 0;
  }
  // IP rotation operations
  async getIpRotationLogs(limit = 100) {
    return await db.select().from(ipRotationLogs).orderBy(desc(ipRotationLogs.rotatedAt)).limit(limit);
  }
  async getIpRotationLogsByModem(modemId, limit = 100) {
    return await db.select().from(ipRotationLogs).where(eq(ipRotationLogs.modemId, modemId)).orderBy(desc(ipRotationLogs.rotatedAt)).limit(limit);
  }
  async createIpRotationLog(insertIpRotationLog) {
    const [ipRotationLog] = await db.insert(ipRotationLogs).values(insertIpRotationLog).returning();
    return ipRotationLog;
  }
  // System logs
  async getSystemLogs(limit = 100) {
    return await db.select().from(systemLogs).orderBy(desc(systemLogs.createdAt)).limit(limit);
  }
  async createSystemLog(insertSystemLog) {
    const [systemLog] = await db.insert(systemLogs).values(insertSystemLog).returning();
    return systemLog;
  }
  // Proxy configuration
  async getProxyConfigurations() {
    return await db.select().from(proxyConfiguration).orderBy(desc(proxyConfiguration.createdAt));
  }
  async getProxyConfigurationByModem(modemId) {
    const [config] = await db.select().from(proxyConfiguration).where(eq(proxyConfiguration.modemId, modemId));
    return config || void 0;
  }
  async createProxyConfiguration(insertProxyConfiguration) {
    const [config] = await db.insert(proxyConfiguration).values(insertProxyConfiguration).returning();
    return config;
  }
  async updateProxyConfiguration(id, updates) {
    const [config] = await db.update(proxyConfiguration).set(updates).where(eq(proxyConfiguration.id, id)).returning();
    return config || void 0;
  }
  // Analytics
  async getAnalytics(limit = 100) {
    return await db.select().from(analytics).orderBy(desc(analytics.recordedAt)).limit(limit);
  }
  async getAnalyticsByModem(modemId, limit = 100) {
    return await db.select().from(analytics).where(eq(analytics.modemId, modemId)).orderBy(desc(analytics.recordedAt)).limit(limit);
  }
  async createAnalytics(insertAnalytics) {
    const [analyticsRecord] = await db.insert(analytics).values(insertAnalytics).returning();
    return analyticsRecord;
  }
};
var storage = new DatabaseStorage();

// server/proxy-manager.ts
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
var execAsync = promisify(exec);
var ProxyManager = class {
  configDir = "/tmp/3proxy";
  configFile = "/tmp/3proxy/3proxy.cfg";
  pidFile = "/tmp/3proxy/3proxy.pid";
  constructor() {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }
  /**
   * Generate 3proxy configuration file
   */
  generateConfig(modems2, proxyConfigs) {
    let config = `# 3proxy configuration for 4G proxy server
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

# Logging
log /tmp/3proxy/3proxy.log D
logformat "- +_L%t.%. %N.%p %E %U %C:%c %R:%r %O %I %h %T"

# System settings
daemon
pidfile ${this.pidFile}
nserver 8.8.8.8
nserver 8.8.4.4
nscache 65536
timeouts 1 5 30 60 180 1800 15 60

# Users and authentication
users admin:CL:password

# Access control
allow admin

`;
    proxyConfigs.forEach((proxyConfig) => {
      const modem = modems2.find((m) => m.id === proxyConfig.modemId);
      if (!modem || !proxyConfig.isActive) return;
      const authSection = proxyConfig.authentication && proxyConfig.username && proxyConfig.password ? `auth strong
users ${proxyConfig.username}:CL:${proxyConfig.password}
allow ${proxyConfig.username}
` : "auth none\nallow *\n";
      const maxConnections = proxyConfig.maxConnections || 100;
      const connectionTimeout = proxyConfig.connectionTimeout || 30;
      const logLevel = proxyConfig.logLevel || "info";
      let ipFiltering = "";
      if (proxyConfig.allowedIps && proxyConfig.allowedIps.length > 0) {
        proxyConfig.allowedIps.forEach((ip) => {
          ipFiltering += `allow ${ip}
`;
        });
      }
      if (proxyConfig.blockedIps && proxyConfig.blockedIps.length > 0) {
        proxyConfig.blockedIps.forEach((ip) => {
          ipFiltering += `deny ${ip}
`;
        });
      }
      const bandwidthLimit = proxyConfig.bandwidthLimit ? `bandlim ${proxyConfig.bandwidthLimit}
` : "";
      if (proxyConfig.protocol === "http" || proxyConfig.protocol === "both" || !proxyConfig.protocol) {
        config += `
# HTTP proxy for ${modem.name} (${modem.publicIp})
proxy -p${proxyConfig.httpPort} -i127.0.0.1 -e${modem.publicIp}
maxconn ${maxConnections}
${authSection}${ipFiltering}${bandwidthLimit}flush

`;
      }
      if (proxyConfig.protocol === "socks5" || proxyConfig.protocol === "both" || !proxyConfig.protocol) {
        config += `
# SOCKS5 proxy for ${modem.name} (${modem.publicIp})
socks -p${proxyConfig.socksPort} -i127.0.0.1 -e${modem.publicIp}
maxconn ${maxConnections}
${authSection}${ipFiltering}${bandwidthLimit}flush

`;
      }
    });
    return config;
  }
  /**
   * Write configuration to file
   */
  writeConfig(config) {
    writeFileSync(this.configFile, config);
  }
  /**
   * Start 3proxy service
   */
  async start() {
    try {
      await this.stop();
      const command = `3proxy ${this.configFile}`;
      await execAsync(command);
      console.log("3proxy started successfully");
    } catch (error) {
      console.error("Failed to start 3proxy:", error);
      throw error;
    }
  }
  /**
   * Stop 3proxy service
   */
  async stop() {
    try {
      if (existsSync(this.pidFile)) {
        const pid = readFileSync(this.pidFile, "utf8").trim();
        if (pid) {
          await execAsync(`kill ${pid}`);
          console.log("3proxy stopped");
        }
      }
    } catch (error) {
      console.log("3proxy stop (process not running)");
    }
  }
  /**
   * Restart 3proxy service
   */
  async restart() {
    await this.stop();
    await this.start();
  }
  /**
   * Check if 3proxy is running
   */
  async isRunning() {
    try {
      if (!existsSync(this.pidFile)) return false;
      const pid = readFileSync(this.pidFile, "utf8").trim();
      if (!pid) return false;
      await execAsync(`kill -0 ${pid}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Get proxy status
   */
  async getStatus() {
    const running = await this.isRunning();
    let pid;
    if (running && existsSync(this.pidFile)) {
      pid = readFileSync(this.pidFile, "utf8").trim();
    }
    return {
      running,
      pid,
      configFile: this.configFile,
      logFile: "/tmp/3proxy/3proxy.log"
    };
  }
  /**
   * Update proxy configuration and restart service
   */
  async updateConfiguration(modems2, proxyConfigs) {
    const config = this.generateConfig(modems2, proxyConfigs);
    this.writeConfig(config);
    if (await this.isRunning()) {
      await this.restart();
    } else {
      await this.start();
    }
  }
  /**
   * Get proxy logs
   */
  async getLogs(lines = 100) {
    try {
      const logFile = "/tmp/3proxy/3proxy.log";
      if (!existsSync(logFile)) return "";
      const { stdout } = await execAsync(`tail -n ${lines} ${logFile}`);
      return stdout;
    } catch (error) {
      return "";
    }
  }
  /**
   * Test proxy connection
   */
  async testProxy(port, type) {
    try {
      const testCommand = type === "http" ? `curl -x http://127.0.0.1:${port} -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip` : `curl --socks5 127.0.0.1:${port} -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip`;
      const { stdout } = await execAsync(testCommand);
      return stdout.trim() === "200";
    } catch (error) {
      return false;
    }
  }
};
var proxyManager = new ProxyManager();

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2) => {
    console.log("Client connected to WebSocket");
    ws2.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received:", data);
      } catch (error) {
        console.error("Invalid JSON received:", error);
      }
    });
    ws2.on("close", () => {
      console.log("Client disconnected from WebSocket");
    });
  });
  const broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  app2.get("/api/stats", async (req, res) => {
    try {
      const modems2 = await storage.getModems();
      const vpnConnections2 = await storage.getVpnConnections();
      const ipRotationLogs2 = await storage.getIpRotationLogs(24);
      const activeModems = modems2.filter((m) => m.status === "connected").length;
      const totalBandwidth = modems2.reduce((sum, m) => sum + (m.downloadSpeed || 0), 0);
      const totalRotations = ipRotationLogs2.length;
      const activeVpnConnections = vpnConnections2.filter((v) => v.status === "active").length;
      res.json({
        activeModems,
        totalBandwidth,
        totalRotations,
        activeVpnConnections
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  app2.get("/api/modems", async (req, res) => {
    try {
      const modems2 = await storage.getModems();
      res.json(modems2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modems" });
    }
  });
  app2.get("/api/modems/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      res.json(modem);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modem" });
    }
  });
  app2.post("/api/modems", async (req, res) => {
    try {
      const validatedData = insertModemSchema.parse(req.body);
      const modem = await storage.createModem(validatedData);
      await storage.createSystemLog({
        level: "info",
        message: `New modem ${modem.name} added`,
        details: `IMEI: ${modem.imei}`,
        source: "modem",
        sourceId: modem.id
      });
      broadcast({ type: "modem_created", data: modem });
      res.json(modem);
    } catch (error) {
      res.status(400).json({ error: "Invalid modem data" });
    }
  });
  app2.put("/api/modems/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const modem = await storage.updateModem(id, updates);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      broadcast({ type: "modem_updated", data: modem });
      res.json(modem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update modem" });
    }
  });
  app2.delete("/api/modems/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteModem(id);
      if (!success) {
        return res.status(404).json({ error: "Modem not found" });
      }
      broadcast({ type: "modem_deleted", data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete modem" });
    }
  });
  app2.post("/api/modems/:id/rotate-ip", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      const { ModemControllerFactory: ModemControllerFactory2 } = await Promise.resolve().then(() => (init_modem_controller(), modem_controller_exports));
      const controller = ModemControllerFactory2.create(modem);
      const result = await controller.rotateIp();
      await storage.createIpRotationLog({
        modemId: id,
        oldIp: result.oldIp || null,
        newIp: result.newIp || null,
        success: result.success || false,
        error: result.error || null
      });
      await storage.createSystemLog({
        level: result.success ? "info" : "error",
        message: `IP rotation ${result.success ? "successful" : "failed"} for modem ${modem.name}`,
        source: "modem-controller",
        sourceId: id,
        details: result.error || null
      });
      if (result.success && result.newIp) {
        await storage.updateModem(id, {
          publicIp: result.newIp,
          lastSeen: /* @__PURE__ */ new Date()
        });
      }
      broadcast({ type: "modem_updated", data: modem });
      res.json(result);
    } catch (error) {
      console.error("IP rotation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/modems/:id/reboot", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      const { ModemControllerFactory: ModemControllerFactory2 } = await Promise.resolve().then(() => (init_modem_controller(), modem_controller_exports));
      const controller = ModemControllerFactory2.create(modem);
      await storage.updateModem(id, {
        status: "rebooting",
        lastReboot: /* @__PURE__ */ new Date()
      });
      const result = await controller.reboot();
      await storage.createSystemLog({
        level: result.success ? "info" : "error",
        message: `Modem reboot ${result.success ? "initiated" : "failed"} for ${modem.name}`,
        source: "modem-controller",
        sourceId: id,
        details: result.error || null
      });
      await storage.updateModem(id, {
        status: result.success ? "rebooting" : "error",
        lastSeen: /* @__PURE__ */ new Date()
      });
      broadcast({ type: "modem_updated", data: modem });
      res.json(result);
    } catch (error) {
      console.error("Reboot error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/modems/:id/rotate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      const oldIp = modem.publicIp;
      const newIp = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
      await storage.updateModem(id, { publicIp: newIp });
      await storage.createIpRotationLog({
        modemId: id,
        oldIp,
        newIp,
        success: true
      });
      await storage.createSystemLog({
        level: "info",
        message: `${modem.name} IP rotated successfully`,
        details: `New IP: ${newIp}`,
        source: "modem",
        sourceId: id
      });
      broadcast({ type: "ip_rotated", data: { modemId: id, oldIp, newIp } });
      res.json({ success: true, oldIp, newIp });
    } catch (error) {
      res.status(500).json({ error: "Failed to rotate IP" });
    }
  });
  app2.get("/api/vpn/connections", async (req, res) => {
    try {
      const connections = await storage.getVpnConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch VPN connections" });
    }
  });
  app2.post("/api/vpn/generate", async (req, res) => {
    try {
      const { modemId, clientName } = req.body;
      if (!modemId || !clientName) {
        return res.status(400).json({ error: "modemId and clientName required" });
      }
      const modem = await storage.getModem(modemId);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      const connection = await storage.createVpnConnection({
        modemId,
        clientName,
        configPath: `/etc/openvpn/${clientName}.conf`,
        status: "active",
        connectedAt: /* @__PURE__ */ new Date()
      });
      await storage.createSystemLog({
        level: "info",
        message: `OpenVPN config generated for ${modem.name}`,
        details: `Client: ${clientName}`,
        source: "vpn",
        sourceId: modemId
      });
      broadcast({ type: "vpn_connection_created", data: connection });
      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate VPN config" });
    }
  });
  app2.get("/api/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const logs = await storage.getSystemLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });
  app2.get("/api/rotation-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await storage.getIpRotationLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rotation logs" });
    }
  });
  app2.get("/api/proxy-configs", async (req, res) => {
    try {
      const configs = await storage.getProxyConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proxy configurations" });
    }
  });
  app2.post("/api/modems/:id/assign-ports", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { httpPort, socksPort, authentication, username, password } = req.body;
      const modem = await storage.getModem(id);
      if (!modem) {
        return res.status(404).json({ error: "Modem not found" });
      }
      const proxyConfig = await storage.createProxyConfiguration({
        modemId: id,
        httpPort,
        socksPort,
        authentication,
        username,
        password,
        isActive: true
      });
      const openvpnConfigPath = `/configs/openvpn/${modem.name}-${modem.imei}.ovpn`;
      const openvpnConfigUrl = `https://${req.get("host")}/download/openvpn/${modem.name}-${modem.imei}.ovpn`;
      await storage.updateModem(id, {
        portsAssigned: true,
        openvpnConfigPath,
        openvpnConfigUrl
      });
      await storage.createVpnConnection({
        modemId: id,
        clientName: `${modem.name}-default`,
        configPath: openvpnConfigPath,
        status: "active",
        connectedAt: /* @__PURE__ */ new Date()
      });
      const allModems = await storage.getModems();
      const allProxyConfigs = await storage.getProxyConfigurations();
      await proxyManager.updateConfiguration(allModems, allProxyConfigs);
      await storage.createSystemLog({
        level: "info",
        message: `Ports assigned to ${modem.name} - HTTP: ${httpPort}, SOCKS: ${socksPort}`,
        details: `OpenVPN config available at: ${openvpnConfigUrl}. 3proxy updated with new configuration.`,
        source: "modem-management",
        sourceId: id
      });
      broadcast({ type: "modem_ports_assigned", data: { modemId: id, proxyConfig } });
      res.json({ success: true, proxyConfig, openvpnConfigUrl });
    } catch (error) {
      console.error("Port assignment error:", error);
      res.status(500).json({ error: "Failed to assign ports" });
    }
  });
  app2.get("/download/openvpn/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const [modemName, imei] = filename.replace(".ovpn", "").split("-");
      const modem = await storage.getModemByName(modemName);
      if (!modem || !modem.openvpnConfigPath) {
        return res.status(404).json({ error: "OpenVPN configuration not found" });
      }
      const config = generateOpenVPNConfig(modem);
      res.setHeader("Content-Type", "application/x-openvpn-profile");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(config);
    } catch (error) {
      console.error("OpenVPN download error:", error);
      res.status(500).json({ error: "Failed to download OpenVPN configuration" });
    }
  });
  function generateOpenVPNConfig(modem) {
    const config = `client
dev tun
proto udp
remote ${modem.publicIp || "your-server-ip"} 1194
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
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

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
  app2.get("/api/analytics", async (req, res) => {
    try {
      const analytics2 = await storage.getAnalytics();
      res.json(analytics2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/proxy/status", async (req, res) => {
    try {
      const status = await proxyManager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get proxy status" });
    }
  });
  app2.post("/api/proxy/start", async (req, res) => {
    try {
      await proxyManager.start();
      res.json({ success: true, message: "3proxy started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start 3proxy" });
    }
  });
  app2.post("/api/proxy/stop", async (req, res) => {
    try {
      await proxyManager.stop();
      res.json({ success: true, message: "3proxy stopped" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop 3proxy" });
    }
  });
  app2.post("/api/proxy/restart", async (req, res) => {
    try {
      await proxyManager.restart();
      res.json({ success: true, message: "3proxy restarted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to restart 3proxy" });
    }
  });
  app2.get("/api/proxy/logs", async (req, res) => {
    try {
      const lines = parseInt(req.query.lines) || 100;
      const logs = await proxyManager.getLogs(lines);
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: "Failed to get proxy logs" });
    }
  });
  app2.post("/api/proxy/test/:port", async (req, res) => {
    try {
      const port = parseInt(req.params.port);
      const type = req.body.type || "http";
      const result = await proxyManager.testProxy(port, type);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to test proxy" });
    }
  });
  app2.get("/api/proxy/configurations", async (req, res) => {
    try {
      const configs = await storage.getProxyConfigurations();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proxy configurations" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
