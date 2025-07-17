import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface ProxyConfig {
  id: number;
  modemId: number;
  httpPort: number;
  socksPort: number;
  authentication: boolean;
  username?: string;
  password?: string;
  isActive: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  keepAlive?: boolean;
  allowedIps?: string[];
  blockedIps?: string[];
  bandwidthLimit?: number;
  dailyTrafficLimit?: number;
  protocol?: string;
  sslEnabled?: boolean;
  logLevel?: string;
  rotateOnDisconnect?: boolean;
  customHeaders?: string;
}

interface Modem {
  id: number;
  name: string;
  localIp: string;
  publicIp: string;
}

export class ProxyManager {
  private configDir = '/tmp/3proxy';
  private configFile = '/tmp/3proxy/3proxy.cfg';
  private pidFile = '/tmp/3proxy/3proxy.pid';

  constructor() {
    // Ensure config directory exists
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Generate 3proxy configuration file
   */
  generateConfig(modems: Modem[], proxyConfigs: ProxyConfig[]): string {
    let config = `# 3proxy configuration for 4G proxy server
# Generated: ${new Date().toISOString()}

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

    // Generate proxy configurations for each modem
    proxyConfigs.forEach(proxyConfig => {
      const modem = modems.find(m => m.id === proxyConfig.modemId);
      if (!modem || !proxyConfig.isActive) return;

      const authSection = proxyConfig.authentication && proxyConfig.username && proxyConfig.password
        ? `auth strong\nusers ${proxyConfig.username}:CL:${proxyConfig.password}\nallow ${proxyConfig.username}\n`
        : 'auth none\nallow *\n';

      // Advanced configuration settings
      const maxConnections = proxyConfig.maxConnections || 100;
      const connectionTimeout = proxyConfig.connectionTimeout || 30;
      const logLevel = proxyConfig.logLevel || 'info';
      
      // IP filtering
      let ipFiltering = '';
      if (proxyConfig.allowedIps && proxyConfig.allowedIps.length > 0) {
        proxyConfig.allowedIps.forEach(ip => {
          ipFiltering += `allow ${ip}\n`;
        });
      }
      if (proxyConfig.blockedIps && proxyConfig.blockedIps.length > 0) {
        proxyConfig.blockedIps.forEach(ip => {
          ipFiltering += `deny ${ip}\n`;
        });
      }

      // Bandwidth limiting
      const bandwidthLimit = proxyConfig.bandwidthLimit ? `bandlim ${proxyConfig.bandwidthLimit}\n` : '';

      // Only generate HTTP proxy if protocol allows it
      if (proxyConfig.protocol === 'http' || proxyConfig.protocol === 'both' || !proxyConfig.protocol) {
        config += `
# HTTP proxy for ${modem.name} (${modem.publicIp})
proxy -p${proxyConfig.httpPort} -i127.0.0.1 -e${modem.publicIp}
maxconn ${maxConnections}
${authSection}${ipFiltering}${bandwidthLimit}flush

`;
      }

      // Only generate SOCKS5 proxy if protocol allows it
      if (proxyConfig.protocol === 'socks5' || proxyConfig.protocol === 'both' || !proxyConfig.protocol) {
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
  writeConfig(config: string): void {
    writeFileSync(this.configFile, config);
  }

  /**
   * Start 3proxy service
   */
  async start(): Promise<void> {
    try {
      // Kill existing process if running
      await this.stop();

      // Start 3proxy with configuration
      const command = `3proxy ${this.configFile}`;
      await execAsync(command);
      
      console.log('3proxy started successfully');
    } catch (error) {
      console.error('Failed to start 3proxy:', error);
      throw error;
    }
  }

  /**
   * Stop 3proxy service
   */
  async stop(): Promise<void> {
    try {
      if (existsSync(this.pidFile)) {
        const pid = readFileSync(this.pidFile, 'utf8').trim();
        if (pid) {
          await execAsync(`kill ${pid}`);
          console.log('3proxy stopped');
        }
      }
    } catch (error) {
      // Ignore errors when stopping (process might not be running)
      console.log('3proxy stop (process not running)');
    }
  }

  /**
   * Restart 3proxy service
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Check if 3proxy is running
   */
  async isRunning(): Promise<boolean> {
    try {
      if (!existsSync(this.pidFile)) return false;
      
      const pid = readFileSync(this.pidFile, 'utf8').trim();
      if (!pid) return false;

      // Check if process is running
      await execAsync(`kill -0 ${pid}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get proxy status
   */
  async getStatus(): Promise<{
    running: boolean;
    pid?: string;
    configFile: string;
    logFile: string;
  }> {
    const running = await this.isRunning();
    let pid;
    
    if (running && existsSync(this.pidFile)) {
      pid = readFileSync(this.pidFile, 'utf8').trim();
    }

    return {
      running,
      pid,
      configFile: this.configFile,
      logFile: '/tmp/3proxy/3proxy.log'
    };
  }

  /**
   * Update proxy configuration and restart service
   */
  async updateConfiguration(modems: Modem[], proxyConfigs: ProxyConfig[]): Promise<void> {
    const config = this.generateConfig(modems, proxyConfigs);
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
  async getLogs(lines: number = 100): Promise<string> {
    try {
      const logFile = '/tmp/3proxy/3proxy.log';
      if (!existsSync(logFile)) return '';
      
      const { stdout } = await execAsync(`tail -n ${lines} ${logFile}`);
      return stdout;
    } catch (error) {
      return '';
    }
  }

  /**
   * Test proxy connection
   */
  async testProxy(port: number, type: 'http' | 'socks5'): Promise<boolean> {
    try {
      const testCommand = type === 'http' 
        ? `curl -x http://127.0.0.1:${port} -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip`
        : `curl --socks5 127.0.0.1:${port} -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip`;
      
      const { stdout } = await execAsync(testCommand);
      return stdout.trim() === '200';
    } catch (error) {
      return false;
    }
  }
}

export const proxyManager = new ProxyManager();