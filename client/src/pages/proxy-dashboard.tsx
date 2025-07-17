import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/lib/websocket';
import { Modem, SystemLog } from '@shared/schema';

export default function ProxyDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEventsLog, setShowEventsLog] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(0);
  const queryClient = useQueryClient();
  const { connected } = useWebSocket();

  // Fetch modems data
  const { data: modems = [], isLoading: modemsLoading } = useQuery({
    queryKey: ['/api/modems'],
  });

  // Fetch system logs
  const { data: logs = [] } = useQuery({
    queryKey: ['/api/logs'],
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  // Fetch proxy configurations
  const { data: proxyConfigs = [] } = useQuery({
    queryKey: ['/api/proxy-configs'],
  });

  // Update refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset refresh timer when data updates
  useEffect(() => {
    setLastRefreshed(0);
  }, [modems, logs, stats]);

  // Filter modems based on search
  const filteredModems = modems.filter((modem: Modem) =>
    modem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modem.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modem.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (modem.publicIp && modem.publicIp.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to get proxy configs for a modem
  const getProxyConfigsForModem = (modemId: number) => {
    return proxyConfigs.filter((config: any) => config.modemId === modemId && config.isActive);
  };

  // IP rotation mutation
  const rotateIpMutation = useMutation({
    mutationFn: (modemId: number) => apiRequest(`/api/modems/${modemId}/rotate-ip`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
    },
  });

  // Reboot mutation
  const rebootMutation = useMutation({
    mutationFn: (modemId: number) => apiRequest(`/api/modems/${modemId}/reboot`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
    },
  });

  const handleIpRotation = (modemId: number) => {
    rotateIpMutation.mutate(modemId);
  };

  const handleReboot = (modemId: number) => {
    rebootMutation.mutate(modemId);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#90EE90';
      case 'disconnected': return '#FFB6C1';
      case 'reconnecting': return '#FFD700';
      case 'rebooting': return '#FFA500';
      case 'error': return '#FF6347';
      default: return '#FFFFFF';
    }
  };

  const getSignalStrengthColor = (strength: number | null) => {
    if (!strength) return '#FFFFFF';
    if (strength > -60) return '#90EE90';
    if (strength > -80) return '#FFD700';
    return '#FFB6C1';
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', padding: '20px' }}>
      {/* Navigation */}
      <table style={{ border: '1px solid gray', width: '100%', marginBottom: '20px' }}>
        <tr>
          <td style={{ padding: '8px' }}>
            <a href="/" style={{ color: '#0066CC', textDecoration: 'none' }}>Main Page</a>
          </td>
          <td style={{ padding: '8px' }}>
            <a href="/modems" style={{ color: '#0066CC', textDecoration: 'none' }}>Edit Modems and Ports</a>
          </td>
          <td style={{ padding: '8px' }}>
            <a href="/configuration" style={{ color: '#0066CC', textDecoration: 'none' }}>Global settings</a>
          </td>
          <td style={{ padding: '8px' }}>
            <a href="/analytics" style={{ color: '#0066CC', textDecoration: 'none' }}>System Status</a>
          </td>
          <td style={{ padding: '8px' }}>
            <a href="/logs" style={{ color: '#0066CC', textDecoration: 'none' }}>System Logs</a>
          </td>
        </tr>
      </table>

      {/* Header */}
      <table id="header" style={{ width: '100%', marginBottom: '20px' }}>
        <tr>
          <td>
            <h2 style={{ margin: '0 0 5px 0' }}>
              4G Proxy Server - Vodafone M300z Management
            </h2>
            <p style={{ fontSize: '70%', margin: '0', color: '#666' }}>
              version: 1.0.0 - M300z Support
            </p>
          </td>
          <td style={{ textAlign: 'right' }}>
            <input type="hidden" id="refresh_interval" value="5" />
            Refreshed <span style={{ fontWeight: 'bold' }}>{lastRefreshed}</span> seconds ago
            <br />
            <span style={{ color: connected ? '#90EE90' : '#FF6347' }}>
              WebSocket: {connected ? 'Connected' : 'Disconnected'}
            </span>
          </td>
        </tr>
      </table>

      {/* Stats Summary */}
      <div style={{ marginBottom: '20px' }}>
        <div>Total modems: <span style={{ fontWeight: 'bold' }}>{modems.length}</span></div>
        <div>Online modems: <span style={{ fontWeight: 'bold' }}>{stats?.activeModems || 0}</span></div>
        <div>Total bandwidth: <span style={{ fontWeight: 'bold' }}>{stats?.totalBandwidth || 0} Mbps</span></div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Nick, IMEI, Status, IP, etc"
          size={35}
          style={{ padding: '4px', border: '1px solid #ccc' }}
        />
        <span 
          style={{ cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
          onClick={clearSearch}
        >
          &#9003;
        </span>
        <br />
        <small><i>(Type <b>disconnected</b> for modems with issues)</i></small>
      </div>

      {/* Modems Table */}
      <table 
        style={{ 
          border: '1px solid gray', 
          width: '100%', 
          borderCollapse: 'collapse',
          marginBottom: '20px'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Nick</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>IMEI</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Public IP</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Ports</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Signal</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Speed</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Provider</th>
            <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {modemsLoading ? (
            <tr>
              <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>Loading modems...</td>
            </tr>
          ) : filteredModems.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>No modems found</td>
            </tr>
          ) : (
            filteredModems.map((modem: Modem) => {
              const configs = getProxyConfigsForModem(modem.id);
              return (
                <tr key={modem.id} style={{ backgroundColor: getStatusColor(modem.status) }}>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    <strong>{modem.name}</strong>
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    {modem.imei}
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    <strong>{modem.status.toUpperCase()}</strong>
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    {modem.publicIp || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    {configs.length > 0 ? (
                      <div>
                        {configs.map((config: any, index: number) => (
                          <div key={config.id} style={{ marginBottom: '2px' }}>
                            <span style={{ fontWeight: 'bold', color: '#0066CC' }}>
                              {config.httpPort}
                            </span>
                            <span style={{ color: '#666' }}> (HTTP)</span>
                            {config.socksPort && (
                              <>
                                <br />
                                <span style={{ fontWeight: 'bold', color: '#0066CC' }}>
                                  {config.socksPort}
                                </span>
                                <span style={{ color: '#666' }}> (SOCKS)</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>No ports assigned</span>
                    )}
                  </td>
                  <td 
                    style={{ 
                      border: '1px solid gray', 
                      padding: '8px',
                      backgroundColor: getSignalStrengthColor(modem.signalStrength)
                    }}
                  >
                    {modem.signalStrength ? `${modem.signalStrength} dBm` : 'N/A'}
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    ↓{modem.downloadSpeed || 0} / ↑{modem.uploadSpeed || 0} Mbps
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    {modem.provider || 'Vodafone'}
                  </td>
                  <td style={{ border: '1px solid gray', padding: '8px' }}>
                    <button
                      onClick={() => handleIpRotation(modem.id)}
                      disabled={rotateIpMutation.isPending}
                      style={{
                        padding: '4px 8px',
                        margin: '2px',
                        fontSize: '12px',
                        border: '1px solid #ccc',
                        backgroundColor: '#f0f0f0',
                        cursor: 'pointer'
                      }}
                    >
                      {rotateIpMutation.isPending ? 'Rotating...' : 'Rotate IP'}
                    </button>
                    <button
                      onClick={() => handleReboot(modem.id)}
                      disabled={rebootMutation.isPending}
                      style={{
                        padding: '4px 8px',
                        margin: '2px',
                        fontSize: '12px',
                        border: '1px solid #ccc',
                        backgroundColor: '#f0f0f0',
                        cursor: 'pointer'
                      }}
                    >
                      {rebootMutation.isPending ? 'Rebooting...' : 'Reboot'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Events Log */}
      <div style={{ marginTop: '20px' }}>
        <div 
          style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            cursor: 'pointer',
            border: '1px solid gray'
          }}
          onClick={() => setShowEventsLog(!showEventsLog)}
        >
          <strong>Events Log {showEventsLog ? '▼' : '▶'}</strong>
        </div>
        {showEventsLog && (
          <table style={{ border: '1px solid gray', width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Time</th>
                <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Level</th>
                <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Source</th>
                <th style={{ border: '1px solid gray', padding: '8px', textAlign: 'left' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No events found</td>
                </tr>
              ) : (
                logs.slice(0, 20).map((log: SystemLog) => (
                  <tr key={log.id}>
                    <td style={{ border: '1px solid gray', padding: '8px' }}>
                      {new Date(log.createdAt).toLocaleString().replace(',', '@')}
                    </td>
                    <td style={{ border: '1px solid gray', padding: '8px' }}>
                      <strong>{log.level.toUpperCase()}</strong>
                    </td>
                    <td style={{ border: '1px solid gray', padding: '8px' }}>
                      {log.source || 'System'}
                    </td>
                    <td style={{ border: '1px solid gray', padding: '8px' }}>
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}