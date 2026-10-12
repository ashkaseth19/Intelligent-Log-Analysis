import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { StatCardSkeleton, ChartSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { THREAT_COLORS, CHART_THEME } from '../utils/colors';
import { formatCompactNumber, formatNumber } from '../utils/formatters';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  PieChart as PieIcon,
  TrendingUp,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const Dashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDashboardStats();
      setStatsData(data);
    } catch (err) {
      console.error('Failed loading dashboard stats:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load dataset telemetry statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Loading dashboard...</p>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton height="h-80" />
          <div className="lg:col-span-2">
            <ChartSkeleton height="h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Dataset telemetry and classification breakdown</p>
        </div>
        <ErrorMessage
          title="Telemetry Data Aggregation Error"
          message={error}
          onRetry={loadDashboard}
          retryLabel="Retry Connection"
        />
      </div>
    );
  }

  if (!statsData || !statsData.summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        </div>
        <EmptyState
          title="No Telemetry Data Available"
          description="Dataset metrics have not yet been generated or the dataset is empty."
          actionLabel="Analyze Logs"
          onAction={() => navigate('/analysis')}
        />
      </div>
    );
  }

  const { summary, logsOverTime, threatDistribution, protocolStats } = statsData;

  // Pie chart data with explicit threat colors
  const pieData = (threatDistribution || []).map((item) => {
    const key = (item.name || '').toLowerCase();
    const color = THREAT_COLORS[key] || THREAT_COLORS.neutral;
    return { ...item, color };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Classification breakdown and telemetry analysis across 6,000,000 dataset records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/analysis')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Upload & Analyze Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. TOP STATS: 4 Simple Stat Cards (Total Logs, Benign, Suspicious, Malicious) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Logs"
          value={summary.totalLogs}
          icon={FileText}
          subtitle="Indexed dataset records"
          colorScheme="blue"
        />
        <StatCard
          title="Benign"
          value={summary.benignEvents}
          icon={ShieldCheck}
          subtitle={`${((summary.benignEvents / summary.totalLogs) * 100).toFixed(2)}% baseline traffic`}
          colorScheme="green"
        />
        <StatCard
          title="Suspicious"
          value={summary.suspiciousEvents}
          icon={AlertTriangle}
          subtitle={`${((summary.suspiciousEvents / summary.totalLogs) * 100).toFixed(2)}% flagged for review`}
          colorScheme="amber"
        />
        <StatCard
          title="Malicious"
          value={summary.maliciousEvents}
          icon={ShieldAlert}
          subtitle={`${((summary.maliciousEvents / summary.totalLogs) * 100).toFixed(2)}% confirmed attacks`}
          colorScheme="red"
        />
      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Threat Distribution Donut Chart */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              Threat Class Distribution
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Proportion of 6,000,000 records categorized as benign, suspicious, and malicious.
            </p>
          </div>

          <div className="w-full flex items-center justify-center my-2" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_THEME.tooltip.contentStyle}
                  formatter={(val) => [formatNumber(val), 'Events']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Benign: 91.96%</span>
            <span>Suspicious: 6.01%</span>
            <span>Malicious: 2.03%</span>
          </div>
        </div>

        {/* Chart 2: Monthly Logs Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Monthly Log Volume & Threat Breakdown
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Monthly ingestion volume across 2024 showing benign baseline traffic alongside detected suspicious and malicious events.
            </p>
          </div>

          <div className="w-full my-2" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={logsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBenign" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THREAT_COLORS.benign} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={THREAT_COLORS.benign} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THREAT_COLORS.suspicious} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THREAT_COLORS.suspicious} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THREAT_COLORS.malicious} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THREAT_COLORS.malicious} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray={CHART_THEME.grid.strokeDasharray} stroke={CHART_THEME.grid.stroke} />
                <XAxis
                  dataKey="time"
                  stroke={CHART_THEME.axis.stroke}
                  tick={{ fontSize: 11, fill: CHART_THEME.axis.tickColor }}
                />
                <YAxis
                  stroke={CHART_THEME.axis.stroke}
                  tick={{ fontSize: 11, fill: CHART_THEME.axis.tickColor }}
                  tickFormatter={formatCompactNumber}
                />
                <Tooltip
                  contentStyle={CHART_THEME.tooltip.contentStyle}
                  formatter={(value, name) => [formatNumber(value), name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="benign"
                  stroke={THREAT_COLORS.benign}
                  fillOpacity={1}
                  fill="url(#colorBenign)"
                  name="Benign"
                />
                <Area
                  type="monotone"
                  dataKey="suspicious"
                  stroke={THREAT_COLORS.suspicious}
                  fillOpacity={1}
                  fill="url(#colorSuspicious)"
                  name="Suspicious"
                />
                <Area
                  type="monotone"
                  dataKey="malicious"
                  stroke={THREAT_COLORS.malicious}
                  fillOpacity={1}
                  fill="url(#colorMalicious)"
                  name="Malicious"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Note: Average ingestion rate is ~500,000 records per month with uniform threat incidence.
          </div>
        </div>
      </div>

      {/* Chart 3: Protocol Volume Chart */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Network Protocol Distribution
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Total log entries recorded by protocol across 6,000,000 records.
          </p>
        </div>

        <div className="w-full my-2" style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={protocolStats || []} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray={CHART_THEME.grid.strokeDasharray} stroke={CHART_THEME.grid.stroke} />
              <XAxis
                dataKey="name"
                stroke={CHART_THEME.axis.stroke}
                tick={{ fontSize: 12, fill: CHART_THEME.axis.tickColor }}
              />
              <YAxis
                stroke={CHART_THEME.axis.stroke}
                tick={{ fontSize: 11, fill: CHART_THEME.axis.tickColor }}
                tickFormatter={formatCompactNumber}
              />
              <Tooltip
                contentStyle={CHART_THEME.tooltip.contentStyle}
                formatter={(val) => [formatNumber(val), 'Records']}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Log Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <span>Top protocols: TCP (1.50M), HTTP (1.20M), HTTPS (1.20M), UDP (900K)</span>
          <span className="font-mono text-slate-400">Sum = 6,000,000</span>
        </div>
      </div>
    </div>
  );
};
