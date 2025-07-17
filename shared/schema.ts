import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const modems = pgTable("modems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imei: text("imei").notNull().unique(),
  localIp: text("local_ip").default("192.168.1.1"), // Default IP for M300z
  publicIp: text("public_ip"),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, reconnecting, error, rebooting
  signalStrength: integer("signal_strength"),
  downloadSpeed: integer("download_speed"), // in MB/s
  uploadSpeed: integer("upload_speed"), // in MB/s
  provider: text("provider"),
  connectionType: text("connection_type"), // 4G, 5G, 3G
  model: text("model").default("M300z"), // Modem model
  firmware: text("firmware"), // Firmware version
  adminUsername: text("admin_username").default("admin"),
  adminPassword: text("admin_password").default("admin"),
  
  // Stage 1 configuration
  apnName: text("apn_name"), // APN for modems that support pushing APN via commands
  apnUsername: text("apn_username"), // APN username
  apnPassword: text("apn_password"), // APN password
  autoIpRotation: boolean("auto_ip_rotation").default(false), // Auto IP rotation setting
  ipRotationInterval: integer("ip_rotation_interval").default(30), // Minutes between rotations
  
  // Stage 2 configuration (set when ports are assigned)
  portsAssigned: boolean("ports_assigned").default(false), // Whether HTTP/SOCKS ports are assigned
  openvpnConfigPath: text("openvpn_config_path"), // Path to OpenVPN config file
  openvpnConfigUrl: text("openvpn_config_url"), // HTTPS URL to download OpenVPN config
  
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  lastReboot: timestamp("last_reboot"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vpnConnections = pgTable("vpn_connections", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  clientName: text("client_name").notNull(),
  configPath: text("config_path"),
  status: text("status").notNull().default("inactive"), // active, inactive, error
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ipRotationLogs = pgTable("ip_rotation_logs", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  oldIp: text("old_ip"),
  newIp: text("new_ip"),
  success: boolean("success").default(true),
  error: text("error"),
  rotatedAt: timestamp("rotated_at").defaultNow(),
});

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // info, warn, error, debug
  message: text("message").notNull(),
  details: text("details"),
  source: text("source"), // modem, vpn, api, system
  sourceId: integer("source_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proxyConfiguration = pgTable("proxy_configuration", {
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
  bandwidthLimit: integer("bandwidth_limit"), // in KB/s
  dailyTrafficLimit: integer("daily_traffic_limit"), // in MB
  protocol: text("protocol").default("both"), // 'http', 'socks5', 'both'
  sslEnabled: boolean("ssl_enabled").default(false),
  logLevel: text("log_level").default("info"), // 'debug', 'info', 'warn', 'error'
  rotateOnDisconnect: boolean("rotate_on_disconnect").default(false),
  customHeaders: text("custom_headers"), // JSON string of custom headers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  modemId: integer("modem_id").references(() => modems.id),
  bandwidth: integer("bandwidth"), // in MB
  connections: integer("connections"),
  rotations: integer("rotations"),
  uptime: integer("uptime"), // in seconds
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertModemSchema = createInsertSchema(modems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVpnConnectionSchema = createInsertSchema(vpnConnections).omit({ id: true, createdAt: true });
export const insertIpRotationLogSchema = createInsertSchema(ipRotationLogs).omit({ id: true, rotatedAt: true });
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true, createdAt: true });
export const insertProxyConfigurationSchema = createInsertSchema(proxyConfiguration).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, recordedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Modem = typeof modems.$inferSelect;
export type InsertModem = z.infer<typeof insertModemSchema>;

export type VpnConnection = typeof vpnConnections.$inferSelect;
export type InsertVpnConnection = z.infer<typeof insertVpnConnectionSchema>;

export type IpRotationLog = typeof ipRotationLogs.$inferSelect;
export type InsertIpRotationLog = z.infer<typeof insertIpRotationLogSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

export type ProxyConfiguration = typeof proxyConfiguration.$inferSelect;
export type InsertProxyConfiguration = z.infer<typeof insertProxyConfigurationSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
