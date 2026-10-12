import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const ErrorMessage = ({
  title = 'Failed to Load Data',
  message = 'An unexpected error occurred while communicating with the backend API.',
  onRetry,
  retryLabel = 'Retry'
}) => {
  return (
    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-red-900">{title}</h3>
          <p className="text-xs text-red-700 mt-0.5">{message}</p>
          <p className="text-xs text-slate-500 mt-1.5 font-mono">
            Ensure Flask backend is running on <code className="bg-white px-1.5 py-0.5 rounded border border-red-200 text-slate-700">http://localhost:5000</code>
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};
