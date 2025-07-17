export interface DashboardStats {
  activeModems: number;
  totalBandwidth: number;
  totalRotations: number;
  activeVpnConnections: number;
}

export interface SystemStatus {
  cpu: string;
  memory: string;
  uptime: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
