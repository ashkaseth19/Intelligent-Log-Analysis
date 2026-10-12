// Central color palette configuration for the entire application (Clean White SOC / Academic Theme)

export const THREAT_COLORS = {
  benign: '#16a34a',     // Green
  suspicious: '#f59e0b', // Amber
  malicious: '#dc2626',  // Red
  neutral: '#2563eb'     // Blue
};

export const SEVERITY_COLORS = {
  low: '#64748b',       // Slate
  medium: '#d97706',    // Amber
  high: '#ea580c',      // Orange
  critical: '#dc2626'   // Red
};

export const CHART_THEME = {
  grid: {
    stroke: '#e2e8f0',
    strokeDasharray: '3 3',
    vertical: false
  },
  axis: {
    stroke: '#cbd5e1',
    tick: { fill: '#64748b', fontSize: 12 },
    tickLine: false
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      color: '#0f172a',
      fontSize: '12px'
    },
    cursor: { fill: '#f1f5f9' }
  },
  legend: {
    wrapperStyle: {
      color: '#475569',
      fontSize: '12px',
      paddingTop: '8px'
    }
  }
};
