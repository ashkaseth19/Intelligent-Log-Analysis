import React from 'react';

export const StatCard = ({ title, value, threatType = 'neutral', subtitle }) => {
  const borderColorMap = {
    neutral: 'border-l-blue-600',
    benign: 'border-l-emerald-600',
    suspicious: 'border-l-amber-500',
    malicious: 'border-l-red-600'
  };

  const dotColorMap = {
    neutral: 'bg-blue-600',
    benign: 'bg-emerald-600',
    suspicious: 'bg-amber-500',
    malicious: 'bg-red-600'
  };

  const borderClass = borderColorMap[threatType] || 'border-l-blue-600';
  const dotClass = dotColorMap[threatType] || 'bg-blue-600';

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm p-4 border-l-[3px] ${borderClass}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
      </div>
      <div className="text-2xl font-semibold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};
