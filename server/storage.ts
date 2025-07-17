import { 
  users, modems, vpnConnections, ipRotationLogs, systemLogs, proxyConfiguration, analytics,
  type User, type InsertUser, type Modem, type InsertModem, type VpnConnection, type InsertVpnConnection,
  type IpRotationLog, type InsertIpRotationLog, type SystemLog, type InsertSystemLog,
  type ProxyConfiguration, type InsertProxyConfiguration, type Analytics, type InsertAnalytics
} from "@shared/schema";
import { db } from './db';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Modem operations
  getModems(): Promise<Modem[]>;
  getModem(id: number): Promise<Modem | undefined>;
  getModemByName(name: string): Promise<Modem | undefined>;
  createModem(modem: InsertModem): Promise<Modem>;
  updateModem(id: number, updates: Partial<InsertModem>): Promise<Modem | undefined>;
  deleteModem(id: number): Promise<boolean>;

  // VPN operations
  getVpnConnections(): Promise<VpnConnection[]>;
  getVpnConnectionsByModem(modemId: number): Promise<VpnConnection[]>;
  createVpnConnection(connection: InsertVpnConnection): Promise<VpnConnection>;
  updateVpnConnection(id: number, updates: Partial<InsertVpnConnection>): Promise<VpnConnection | undefined>;

  // IP rotation operations
  getIpRotationLogs(limit?: number): Promise<IpRotationLog[]>;
  getIpRotationLogsByModem(modemId: number, limit?: number): Promise<IpRotationLog[]>;
  createIpRotationLog(log: InsertIpRotationLog): Promise<IpRotationLog>;

  // System logs
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;

  // Proxy configuration
  getProxyConfigurations(): Promise<ProxyConfiguration[]>;
  getProxyConfigurationByModem(modemId: number): Promise<ProxyConfiguration | undefined>;
  createProxyConfiguration(config: InsertProxyConfiguration): Promise<ProxyConfiguration>;
  updateProxyConfiguration(id: number, updates: Partial<InsertProxyConfiguration>): Promise<ProxyConfiguration | undefined>;

  // Analytics
  getAnalytics(limit?: number): Promise<Analytics[]>;
  getAnalyticsByModem(modemId: number, limit?: number): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private modems: Map<number, Modem> = new Map();
  private vpnConnections: Map<number, VpnConnection> = new Map();
  private ipRotationLogs: Map<number, IpRotationLog> = new Map();
  private systemLogs: Map<number, SystemLog> = new Map();
  private proxyConfigurations: Map<number, ProxyConfiguration> = new Map();
  private analytics: Map<number, Analytics> = new Map();
  private currentId = 1;

  constructor() {
    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default Vodafone M300z modems
    const defaultModems: Modem[] = [
      {
        id: 1,
        name: "M300z-001",
        imei: "356938035643809",
        localIp: "192.168.1.1",
        publicIp: "203.0.113.45",
        status: "connected",
        signalStrength: -65,
        downloadSpeed: 45,
        uploadSpeed: 12,
        provider: "Vodafone",
        connectionType: "4G",
        model: "M300z",
        firmware: "BD_M300zV1.1",
        adminUsername: "admin",
        adminPassword: "admin",
        isActive: true,
        lastSeen: new Date(),
        lastReboot: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: "M300z-002",
        imei: "356938035643810",
        localIp: "192.168.1.1",
        publicIp: "203.0.113.46",
        status: "connected",
        signalStrength: -78,
        downloadSpeed: 32,
        uploadSpeed: 8,
        provider: "Vodafone",
        connectionType: "4G",
        model: "M300z",
        firmware: "BD_M300zV1.1",
        adminUsername: "admin",
        adminPassword: "admin",
        isActive: true,
        lastSeen: new Date(),
        lastReboot: new Date(Date.now() - 12 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: "M300z-003",
        imei: "356938035643811",
        localIp: "192.168.1.1",
        publicIp: null,
        status: "reconnecting",
        signalStrength: -95,
        downloadSpeed: 0,
        uploadSpeed: 0,
        provider: "Vodafone",
        connectionType: "4G",
        model: "M300z",
        firmware: "BD_M300zV1.1",
        adminUsername: "admin",
        adminPassword: "admin",
        isActive: true,
        lastSeen: new Date(),
        lastReboot: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: "M300z-004",
        imei: "356938035643812",
        localIp: "192.168.1.1",
        publicIp: "203.0.113.47",
        status: "connected",
        signalStrength: -58,
        downloadSpeed: 67,
        uploadSpeed: 18,
        provider: "Vodafone",
        connectionType: "4G",
        model: "M300z",
        firmware: "BD_M300zV1.1",
        adminUsername: "admin",
        adminPassword: "admin",
        isActive: true,
        lastSeen: new Date(),
        lastReboot: new Date(Date.now() - 3 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultModems.forEach(modem => {
      this.modems.set(modem.id, modem);
    });

    // Create default VPN connections
    const defaultVpnConnections: VpnConnection[] = [
      {
        id: 1,
        modemId: 1,
        clientName: "vpn-client-001",
        configPath: "/etc/openvpn/client001.conf",
        status: "active",
        connectedAt: new Date(),
        disconnectedAt: null,
        createdAt: new Date()
      },
      {
        id: 2,
        modemId: 2,
        clientName: "vpn-client-002",
        configPath: "/etc/openvpn/client002.conf",
        status: "active",
        connectedAt: new Date(),
        disconnectedAt: null,
        createdAt: new Date()
      },
      {
        id: 3,
        modemId: 4,
        clientName: "vpn-client-003",
        configPath: "/etc/openvpn/client003.conf",
        status: "active",
        connectedAt: new Date(),
        disconnectedAt: null,
        createdAt: new Date()
      }
    ];

    defaultVpnConnections.forEach(conn => {
      this.vpnConnections.set(conn.id, conn);
    });

    // Create default system logs
    const defaultLogs: SystemLog[] = [
      {
        id: 1,
        level: "info",
        message: "Modem-001 IP rotated successfully",
        details: "New IP: 203.0.113.48",
        source: "modem",
        sourceId: 1,
        createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        id: 2,
        level: "info",
        message: "OpenVPN config generated for Modem-004",
        details: "Client: vpn-client-001",
        source: "vpn",
        sourceId: 4,
        createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        id: 3,
        level: "warn",
        message: "Modem-003 connection unstable",
        details: "Signal strength: -95 dBm",
        source: "modem",
        sourceId: 3,
        createdAt: new Date(Date.now() - 12 * 60 * 1000) // 12 minutes ago
      }
    ];

    defaultLogs.forEach(log => {
      this.systemLogs.set(log.id, log);
    });

    this.currentId = 5;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Modem operations
  async getModems(): Promise<Modem[]> {
    return Array.from(this.modems.values());
  }

  async getModem(id: number): Promise<Modem | undefined> {
    return this.modems.get(id);
  }

  async getModemByName(name: string): Promise<Modem | undefined> {
    for (const modem of this.modems.values()) {
      if (modem.name === name) {
        return modem;
      }
    }
    return undefined;
  }

  async createModem(insertModem: InsertModem): Promise<Modem> {
    const id = this.currentId++;
    const now = new Date();
    const modem: Modem = { 
      ...insertModem, 
      id, 
      status: insertModem.status || 'disconnected',
      createdAt: now, 
      updatedAt: now 
    };
    this.modems.set(id, modem);
    return modem;
  }

  async updateModem(id: number, updates: Partial<InsertModem>): Promise<Modem | undefined> {
    const existing = this.modems.get(id);
    if (!existing) return undefined;

    const updated: Modem = { ...existing, ...updates, updatedAt: new Date() };
    this.modems.set(id, updated);
    return updated;
  }

  async deleteModem(id: number): Promise<boolean> {
    return this.modems.delete(id);
  }

  // VPN operations
  async getVpnConnections(): Promise<VpnConnection[]> {
    return Array.from(this.vpnConnections.values());
  }

  async getVpnConnectionsByModem(modemId: number): Promise<VpnConnection[]> {
    return Array.from(this.vpnConnections.values()).filter(conn => conn.modemId === modemId);
  }

  async createVpnConnection(insertConnection: InsertVpnConnection): Promise<VpnConnection> {
    const id = this.currentId++;
    const connection: VpnConnection = { 
      ...insertConnection, 
      id, 
      status: insertConnection.status || 'disconnected',
      createdAt: new Date() 
    };
    this.vpnConnections.set(id, connection);
    return connection;
  }

  async updateVpnConnection(id: number, updates: Partial<InsertVpnConnection>): Promise<VpnConnection | undefined> {
    const existing = this.vpnConnections.get(id);
    if (!existing) return undefined;

    const updated: VpnConnection = { ...existing, ...updates };
    this.vpnConnections.set(id, updated);
    return updated;
  }

  // IP rotation operations
  async getIpRotationLogs(limit: number = 50): Promise<IpRotationLog[]> {
    return Array.from(this.ipRotationLogs.values())
      .sort((a, b) => (b.rotatedAt || new Date(0)).getTime() - (a.rotatedAt || new Date(0)).getTime())
      .slice(0, limit);
  }

  async getIpRotationLogsByModem(modemId: number, limit: number = 50): Promise<IpRotationLog[]> {
    return Array.from(this.ipRotationLogs.values())
      .filter(log => log.modemId === modemId)
      .sort((a, b) => (b.rotatedAt || new Date(0)).getTime() - (a.rotatedAt || new Date(0)).getTime())
      .slice(0, limit);
  }

  async createIpRotationLog(insertLog: InsertIpRotationLog): Promise<IpRotationLog> {
    const id = this.currentId++;
    const log: IpRotationLog = { 
      ...insertLog, 
      id, 
      modemId: insertLog.modemId || null,
      oldIp: insertLog.oldIp || null,
      newIp: insertLog.newIp || null,
      success: insertLog.success || false,
      error: insertLog.error || null,
      rotatedAt: new Date() 
    };
    this.ipRotationLogs.set(id, log);
    return log;
  }

  // System logs
  async getSystemLogs(limit: number = 100): Promise<SystemLog[]> {
    return Array.from(this.systemLogs.values())
      .sort((a, b) => (b.createdAt || new Date(0)).getTime() - (a.createdAt || new Date(0)).getTime())
      .slice(0, limit);
  }

  async createSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const id = this.currentId++;
    const log: SystemLog = { 
      ...insertLog, 
      id, 
      details: insertLog.details || null,
      source: insertLog.source || null,
      sourceId: insertLog.sourceId || null,
      createdAt: new Date() 
    };
    this.systemLogs.set(id, log);
    return log;
  }

  // Proxy configuration
  async getProxyConfigurations(): Promise<ProxyConfiguration[]> {
    return Array.from(this.proxyConfigurations.values());
  }

  async getProxyConfigurationByModem(modemId: number): Promise<ProxyConfiguration | undefined> {
    return Array.from(this.proxyConfigurations.values()).find(config => config.modemId === modemId);
  }

  async createProxyConfiguration(insertConfig: InsertProxyConfiguration): Promise<ProxyConfiguration> {
    const id = this.currentId++;
    const now = new Date();
    const config: ProxyConfiguration = { ...insertConfig, id, createdAt: now, updatedAt: now };
    this.proxyConfigurations.set(id, config);
    return config;
  }

  async updateProxyConfiguration(id: number, updates: Partial<InsertProxyConfiguration>): Promise<ProxyConfiguration | undefined> {
    const existing = this.proxyConfigurations.get(id);
    if (!existing) return undefined;

    const updated: ProxyConfiguration = { ...existing, ...updates, updatedAt: new Date() };
    this.proxyConfigurations.set(id, updated);
    return updated;
  }

  // Analytics
  async getAnalytics(limit: number = 100): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }

  async getAnalyticsByModem(modemId: number, limit: number = 100): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(analytics => analytics.modemId === modemId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = this.currentId++;
    const analytics: Analytics = { ...insertAnalytics, id, recordedAt: new Date() };
    this.analytics.set(id, analytics);
    return analytics;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Modem operations
  async getModems(): Promise<Modem[]> {
    return await db.select().from(modems).orderBy(desc(modems.createdAt));
  }

  async getModem(id: number): Promise<Modem | undefined> {
    const [modem] = await db.select().from(modems).where(eq(modems.id, id));
    return modem || undefined;
  }

  async getModemByName(name: string): Promise<Modem | undefined> {
    const [modem] = await db.select().from(modems).where(eq(modems.name, name));
    return modem || undefined;
  }

  async createModem(insertModem: InsertModem): Promise<Modem> {
    const [modem] = await db
      .insert(modems)
      .values(insertModem)
      .returning();
    return modem;
  }

  async updateModem(id: number, updates: Partial<InsertModem>): Promise<Modem | undefined> {
    const [modem] = await db
      .update(modems)
      .set(updates)
      .where(eq(modems.id, id))
      .returning();
    return modem || undefined;
  }

  async deleteModem(id: number): Promise<boolean> {
    const result = await db.delete(modems).where(eq(modems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // VPN operations
  async getVpnConnections(): Promise<VpnConnection[]> {
    return await db.select().from(vpnConnections).orderBy(desc(vpnConnections.createdAt));
  }

  async getVpnConnectionsByModem(modemId: number): Promise<VpnConnection[]> {
    return await db.select().from(vpnConnections).where(eq(vpnConnections.modemId, modemId));
  }

  async createVpnConnection(insertVpnConnection: InsertVpnConnection): Promise<VpnConnection> {
    const [vpnConnection] = await db
      .insert(vpnConnections)
      .values(insertVpnConnection)
      .returning();
    return vpnConnection;
  }

  async updateVpnConnection(id: number, updates: Partial<InsertVpnConnection>): Promise<VpnConnection | undefined> {
    const [vpnConnection] = await db
      .update(vpnConnections)
      .set(updates)
      .where(eq(vpnConnections.id, id))
      .returning();
    return vpnConnection || undefined;
  }

  // IP rotation operations
  async getIpRotationLogs(limit: number = 100): Promise<IpRotationLog[]> {
    return await db.select().from(ipRotationLogs)
      .orderBy(desc(ipRotationLogs.rotatedAt))
      .limit(limit);
  }

  async getIpRotationLogsByModem(modemId: number, limit: number = 100): Promise<IpRotationLog[]> {
    return await db.select().from(ipRotationLogs)
      .where(eq(ipRotationLogs.modemId, modemId))
      .orderBy(desc(ipRotationLogs.rotatedAt))
      .limit(limit);
  }

  async createIpRotationLog(insertIpRotationLog: InsertIpRotationLog): Promise<IpRotationLog> {
    const [ipRotationLog] = await db
      .insert(ipRotationLogs)
      .values(insertIpRotationLog)
      .returning();
    return ipRotationLog;
  }

  // System logs
  async getSystemLogs(limit: number = 100): Promise<SystemLog[]> {
    return await db.select().from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit);
  }

  async createSystemLog(insertSystemLog: InsertSystemLog): Promise<SystemLog> {
    const [systemLog] = await db
      .insert(systemLogs)
      .values(insertSystemLog)
      .returning();
    return systemLog;
  }

  // Proxy configuration
  async getProxyConfigurations(): Promise<ProxyConfiguration[]> {
    return await db.select().from(proxyConfiguration).orderBy(desc(proxyConfiguration.createdAt));
  }

  async getProxyConfigurationByModem(modemId: number): Promise<ProxyConfiguration | undefined> {
    const [config] = await db.select().from(proxyConfiguration).where(eq(proxyConfiguration.modemId, modemId));
    return config || undefined;
  }

  async createProxyConfiguration(insertProxyConfiguration: InsertProxyConfiguration): Promise<ProxyConfiguration> {
    const [config] = await db
      .insert(proxyConfiguration)
      .values(insertProxyConfiguration)
      .returning();
    return config;
  }

  async updateProxyConfiguration(id: number, updates: Partial<InsertProxyConfiguration>): Promise<ProxyConfiguration | undefined> {
    const [config] = await db
      .update(proxyConfiguration)
      .set(updates)
      .where(eq(proxyConfiguration.id, id))
      .returning();
    return config || undefined;
  }

  // Analytics
  async getAnalytics(limit: number = 100): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .orderBy(desc(analytics.recordedAt))
      .limit(limit);
  }

  async getAnalyticsByModem(modemId: number, limit: number = 100): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .where(eq(analytics.modemId, modemId))
      .orderBy(desc(analytics.recordedAt))
      .limit(limit);
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analyticsRecord] = await db
      .insert(analytics)
      .values(insertAnalytics)
      .returning();
    return analyticsRecord;
  }
}

export const storage = new DatabaseStorage();
