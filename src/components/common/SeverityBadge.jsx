import React from 'react';

export const SeverityBadge = ({ severity }) => {
  const norm = (severity || '').toLowerCase();

  const styles = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-orange-50 text-orange-700',
    critical: 'bg-red-50 text-red-700 font-medium'
  };

  const badgeStyle = styles[norm] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${badgeStyle}`}>
      {severity}
    </span>
  );
};
