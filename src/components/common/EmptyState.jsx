import React from 'react';
import { FileSearch } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FileSearch,
  title = 'No records found',
  description = 'There are no items matching the requested criteria.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="p-8 rounded-lg bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
      <div className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 mb-1">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
