import React from 'react';
import { X, Info } from 'lucide-react';
import { ThreatBadge } from '../common/ThreatBadge';
import { SeverityBadge } from '../common/SeverityBadge';
import { ActionBadge } from '../common/ActionBadge';

export const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-lg text-slate-900 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Log Record Details
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{event.id || 'Log Entry'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Threat:</span>
              <ThreatBadge label={event.threat_label} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Severity:</span>
              <SeverityBadge severity={event.severity} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Action:</span>
              <ActionBadge action={event.action} />
            </div>
          </div>

          {/* Responsive Grid of Fields (1-col on mobile, 2-col on sm+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Timestamp</p>
              <p className="text-xs font-mono text-slate-900 mt-0.5">{event.timestamp || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Protocol</p>
              <p className="text-xs font-mono text-slate-900 mt-0.5">{event.protocol || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Source IP</p>
              <p className="text-xs font-mono text-blue-700 mt-0.5">{event.source_ip || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Destination IP</p>
              <p className="text-xs font-mono text-slate-900 mt-0.5">{event.dest_ip || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Log Type</p>
              <p className="text-xs capitalize text-slate-900 mt-0.5">{event.log_type || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bytes Transferred</p>
              <p className="text-xs font-mono text-slate-900 mt-0.5">
                {event.bytes_transferred !== undefined ? Number(event.bytes_transferred).toLocaleString() : '-'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">Request Path</p>
              <p className="text-xs font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5 break-all">
                {event.request_path || '/'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">User Agent</p>
              <p className="text-xs font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5 break-all">
                {event.user_agent || '-'}
              </p>
            </div>
          </div>

          {/* Explanation Box */}
          {event.explanation && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-1">
              <p className="text-xs font-medium text-slate-700">Classification Context</p>
              <p className="text-xs text-slate-600 leading-relaxed">{event.explanation}</p>
            </div>
          )}

          {/* Rule-Derived Severity Note */}
          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Severity is derived from rules and is not a field in the dataset.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
