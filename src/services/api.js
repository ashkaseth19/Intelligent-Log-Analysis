import axios from 'axios';
import {
  MOCK_LOGS,
  MOCK_SUMMARY_STATS,
  MOCK_SEVERITY_SUMMARY,
  MOCK_LOGS_OVER_TIME,
  MOCK_THREAT_DISTRIBUTION,
  MOCK_PROTOCOL_STATS,
  MOCK_LOG_TYPE_STATS,
  MOCK_ACTION_STATS
} from '../data/mockLogs';

// Base API client - uses Vite proxy ('/api') by default, or VITE_API_URL if specified
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Flag to route calls to live Flask backend (http://localhost:5000/api)
const USE_MOCK = false;

export const apiService = {
  // Check backend health and model loading status
  async getHealth() {
    if (USE_MOCK) {
      return { status: 'healthy', models_status: 'ready', dataset_loaded: true };
    }
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Fetch dashboard summary statistics computed from the 6,000,000-record dataset
  async getDashboardStats() {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            summary: MOCK_SUMMARY_STATS,
            severitySummary: MOCK_SEVERITY_SUMMARY,
            logsOverTime: MOCK_LOGS_OVER_TIME,
            threatDistribution: MOCK_THREAT_DISTRIBUTION,
            protocolStats: MOCK_PROTOCOL_STATS,
            logTypeDistribution: MOCK_LOG_TYPE_STATS,
            actionStats: MOCK_ACTION_STATS
          });
        }, 200);
      });
    }
    const response = await apiClient.get('/stats');
    return response.data;
  },

  // Fetch log list with filters & pagination matching actual dataset fields
  async getLogs(params = {}) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let filtered = [...MOCK_LOGS];

          if (params.search) {
            const query = params.search.toLowerCase().trim();
            filtered = filtered.filter(
              (log) =>
                (log.source_ip && log.source_ip.toLowerCase().includes(query)) ||
                (log.dest_ip && log.dest_ip.toLowerCase().includes(query)) ||
                (log.request_path && log.request_path.toLowerCase().includes(query)) ||
                (log.user_agent && log.user_agent.toLowerCase().includes(query)) ||
                (log.explanation && log.explanation.toLowerCase().includes(query))
            );
          }

          if (params.protocol && params.protocol !== 'ALL') {
            filtered = filtered.filter(
              (log) => log.protocol && log.protocol.toUpperCase() === params.protocol.toUpperCase()
            );
          }

          if (params.action && params.action !== 'ALL') {
            filtered = filtered.filter(
              (log) => log.action && log.action.toLowerCase() === params.action.toLowerCase()
            );
          }

          if (params.log_type && params.log_type !== 'ALL') {
            filtered = filtered.filter(
              (log) => log.log_type && log.log_type.toLowerCase() === params.log_type.toLowerCase()
            );
          }

          if (params.threat_label && params.threat_label !== 'ALL') {
            filtered = filtered.filter(
              (log) => log.threat_label && log.threat_label.toLowerCase() === params.threat_label.toLowerCase()
            );
          }

          const page = Number(params.page) || 1;
          const pageSize = Number(params.pageSize) || 10;
          const start = (page - 1) * pageSize;
          const paginated = filtered.slice(start, start + pageSize);

          resolve({
            data: paginated,
            total: filtered.length,
            page,
            pageSize
          });
        }, 150);
      });
    }
    const response = await apiClient.get('/logs', { params });
    return response.data;
  },

  // Upload & parse log file structure and fields
  async analyzeLogs(file) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Schema inspection and field profiling without fake ML scores
          resolve({
            filename: file.name,
            fileSize: `${(file.size / 1024).toFixed(2)} KB`,
            processedLogsCount: 4,
            analysisSummary: {
              benign: 2,
              suspicious: 1,
              malicious: 1
            },
            results: [
              {
                id: `LOG-MAL-DEMO-${Date.now()}-1`,
                timestamp: '2024-11-21 00:00:00',
                source_ip: '187.14.173.168',
                dest_ip: '192.168.1.78',
                protocol: 'HTTP',
                action: 'allowed',
                threat_label: 'malicious',
                severity: 'High',
                log_type: 'firewall',
                bytes_transferred: 2538,
                user_agent: 'curl/7.64.1',
                request_path: '/api/login?DROP TABLE',
                explanation: 'Destructive SQL query syntax identified in URI parameter payload.'
              },
              {
                id: `LOG-SUS-DEMO-${Date.now()}-2`,
                timestamp: '2024-12-05 00:00:00',
                source_ip: '141.26.13.167',
                dest_ip: '192.168.1.141',
                protocol: 'TCP',
                action: 'allowed',
                threat_label: 'suspicious',
                severity: 'Medium',
                log_type: 'ids',
                bytes_transferred: 26588,
                user_agent: 'SQLMap/1.6-dev',
                request_path: '/?..\\..\\etc\\passwd',
                explanation: 'Path traversal sequence detected aiming to access system configuration files.'
              },
              {
                id: `LOG-BEN-DEMO-${Date.now()}-3`,
                timestamp: '2024-04-07 00:00:00',
                source_ip: '192.168.1.248',
                dest_ip: '192.168.1.15',
                protocol: 'HTTP',
                action: 'allowed',
                threat_label: 'benign',
                severity: 'Low',
                log_type: 'application',
                bytes_transferred: 20652,
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                request_path: '/login',
                explanation: 'Standard interactive web browser session with normal response volume.'
              },
              {
                id: `LOG-BEN-DEMO-${Date.now()}-4`,
                timestamp: '2024-10-14 00:00:00',
                source_ip: '192.168.1.20',
                dest_ip: '192.168.1.242',
                protocol: 'HTTPS',
                action: 'allowed',
                threat_label: 'benign',
                severity: 'Low',
                log_type: 'application',
                bytes_transferred: 2461,
                user_agent: 'curl/7.64.1',
                request_path: '/admin/config',
                explanation: 'Internal infrastructure telemetry check against configuration endpoint.'
              }
            ]
          });
        }, 1200);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Fetch threat alerts (suspicious & malicious)
  async getAlerts(severityFilter = 'ALL') {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let threats = MOCK_LOGS.filter(
            (log) => log.threat_label === 'suspicious' || log.threat_label === 'malicious'
          );
          if (severityFilter !== 'ALL') {
            threats = threats.filter((log) => log.severity.toLowerCase() === severityFilter.toLowerCase());
          }
          resolve(threats);
        }, 150);
      });
    }
    const response = await apiClient.get('/alerts', { params: { severity: severityFilter } });
    return response.data;
  },

  // Fetch ML evaluation report metrics
  async getReportMetrics() {
    if (USE_MOCK) {
      return null;
    }
    const response = await apiClient.get('/reports');
    return response.data;
  },

  // Export report trigger - downloads file directly in browser
  async exportReport(format = 'pdf') {
    const fmt = format.toLowerCase();
    const response = await apiClient.get('/reports/export', {
      params: { format: fmt },
      responseType: 'blob'
    });
    const blob = new Blob([response.data], {
      type: fmt === 'csv' ? 'text/csv' : 'application/pdf'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threat_detection_model_report.${fmt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, message: `Downloaded ${fmt.toUpperCase()} report successfully.` };
  }
};
