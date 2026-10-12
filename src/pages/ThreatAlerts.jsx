import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ActionBadge } from '../components/common/ActionBadge';
import { EventDetailModal } from '../components/modals/EventDetailModal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import { formatNumber } from '../utils/formatters';
import {
  ShieldAlert,
  Filter,
  Eye,
  RefreshCw,
  Search,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const ThreatAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Client-side pagination for alerts list
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchAlertsData = async (severity) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAlerts(severity);
      setAlerts(data || []);
      setPage(1);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to retrieve active threat alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData(severityFilter);
  }, [severityFilter]);

  // Client-side search filtering
  const filteredAlerts = alerts.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.source_ip && item.source_ip.toLowerCase().includes(q)) ||
      (item.dest_ip && item.dest_ip.toLowerCase().includes(q)) ||
      (item.request_path && item.request_path.toLowerCase().includes(q)) ||
      (item.protocol && item.protocol.toLowerCase().includes(q)) ||
      (item.user_agent && item.user_agent.toLowerCase().includes(q)) ||
      (item.explanation && item.explanation.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredAlerts.length / pageSize) || 1;
  const paginatedAlerts = filteredAlerts.slice((page - 1) * pageSize, page * pageSize);
  const startItem = filteredAlerts.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredAlerts.length);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Threat Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Active suspicious and malicious events detected in the dataset
          </p>
        </div>

        {/* Severity Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {['ALL', 'Medium', 'High', 'Critical'].map((level) => (
            <button
              key={level}
              onClick={() => setSeverityFilter(level)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                severityFilter === level
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {level}
            </button>
          ))}
          <button
            onClick={() => fetchAlertsData(severityFilter)}
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            title="Refresh alerts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Derived Severity Note */}
      <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Methodology Note:</strong> Severity is derived from rules and is not a field in the dataset.
          Alerts are filtered exclusively to suspicious and malicious events.
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search IP, path, payload query..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500 self-end sm:self-auto">
          Showing <strong className="text-slate-800">{filteredAlerts.length}</strong> alerts in stream
        </div>
      </div>

      {/* Alerts Table Card */}
      {error ? (
        <ErrorMessage
          title="Security Alerts Fetch Error"
          message={error}
          onRetry={() => fetchAlertsData(severityFilter)}
          retryLabel="Retry Alerts Stream"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Detected Threat Incident Feed
            </h2>
            <span className="text-xs text-slate-500">
              {formatNumber(alerts.length)} active events in buffer
            </span>
          </div>

          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={8} cols={8} />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Threat Alerts Found"
                description={`No alerts match the selected severity (${severityFilter}) and search query.`}
                actionLabel="Clear Filter"
                onAction={() => {
                  setSeverityFilter('ALL');
                  setSearchTerm('');
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                    <th className="p-3 whitespace-nowrap">Timestamp</th>
                    <th className="p-3 whitespace-nowrap">Source IP</th>
                    <th className="p-3 whitespace-nowrap">Destination IP</th>
                    <th className="p-3 whitespace-nowrap">Protocol</th>
                    <th className="p-3 whitespace-nowrap">Action</th>
                    <th className="p-3 whitespace-nowrap">Log Type</th>
                    <th className="p-3 whitespace-nowrap">Threat Label</th>
                    <th className="p-3 whitespace-nowrap">Derived Severity</th>
                    <th className="p-3 text-right whitespace-nowrap">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAlerts.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEvent(log)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                    >
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3 font-mono text-blue-700 font-medium whitespace-nowrap">{log.source_ip}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{log.dest_ip}</td>
                      <td className="p-3 font-mono text-slate-800 font-medium whitespace-nowrap">{log.protocol}</td>
                      <td className="p-3 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="p-3 capitalize text-slate-700 whitespace-nowrap">{log.log_type}</td>
                      <td className="p-3 whitespace-nowrap">
                        <ThreatBadge label={log.threat_label} />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <SeverityBadge severity={log.severity} />
                      </td>
                      <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedEvent(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                          title="Inspect Alert"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredAlerts.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing <strong className="text-slate-900">{startItem}</strong> to{' '}
                <strong className="text-slate-900">{endItem}</strong> of{' '}
                <strong className="text-slate-900">{filteredAlerts.length}</strong> alerts
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-slate-700 font-medium px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
