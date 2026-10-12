import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Info,
  Filter
} from 'lucide-react';

export const Logs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filters State
  const [search, setSearch] = useState(initialSearch);
  const [protocol, setProtocol] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [logType, setLogType] = useState('ALL');
  const [threatLabel, setThreatLabel] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Sync search param if URL changes
  useEffect(() => {
    const q = searchParams.get('search') || '';
    if (q !== search) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams, search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getLogs({
        search,
        protocol,
        action,
        log_type: logType,
        threat_label: threatLabel,
        page,
        pageSize
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed fetching logs:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to query log records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, protocol, action, logType, threatLabel, page, pageSize]);

  const resetFilters = () => {
    setSearch('');
    setProtocol('ALL');
    setAction('ALL');
    setLogType('ALL');
    setThreatLabel('ALL');
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / pageSize) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Log Browser</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and inspect structured logs from the 6,000,000-record dataset
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
            {formatNumber(total)} Matched Records
          </span>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Derived Severity Note Alert */}
      <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Methodology Note:</strong> Severity is derived from rules and is not a field in the dataset.
          (Benign = Low; Suspicious = Medium; Malicious + Blocked = High; Malicious + Allowed = Critical).
        </span>
      </div>

      {/* Filter Control Panel */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search IP, path, agent..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>

          {/* Protocol Filter */}
          <div>
            <select
              value={protocol}
              onChange={(e) => {
                setProtocol(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Protocol: All</option>
              <option value="TCP">TCP</option>
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
              <option value="SSH">SSH</option>
              <option value="FTP">FTP</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Action: All</option>
              <option value="allowed">Allowed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Log Type Filter */}
          <div>
            <select
              value={logType}
              onChange={(e) => {
                setLogType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Log Type: All</option>
              <option value="application">Application</option>
              <option value="ids">IDS</option>
              <option value="firewall">Firewall</option>
            </select>
          </div>

          {/* Threat Label Filter */}
          <div>
            <select
              value={threatLabel}
              onChange={(e) => {
                setThreatLabel(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Threat Label: All</option>
              <option value="benign">Benign</option>
              <option value="suspicious">Suspicious</option>
              <option value="malicious">Malicious</option>
            </select>
          </div>
        </div>

        {/* Filter Footer / Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Showing query sample from 100,000 uniform sampled records
          </span>
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1.5 py-0.5 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs Table Card */}
      {error ? (
        <ErrorMessage
          title="Log Query Error"
          message={error}
          onRetry={fetchLogs}
          retryLabel="Retry Query"
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={pageSize} cols={8} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No Logs Matched Criteria"
                description="Try loosening your filters, search terms, or resetting to default view."
                actionLabel="Reset All Filters"
                onAction={resetFilters}
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
                  {logs.map((log) => (
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
                          title="Inspect Event"
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

          {/* Pagination Controls */}
          {!loading && logs.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Showing <strong className="text-slate-900">{startItem}</strong> to{' '}
                  <strong className="text-slate-900">{endItem}</strong> of{' '}
                  <strong className="text-slate-900">{formatNumber(total)}</strong> entries
                </span>
                <span className="text-slate-400">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Page size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
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
