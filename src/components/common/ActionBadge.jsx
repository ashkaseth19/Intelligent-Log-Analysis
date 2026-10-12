import React from 'react';

export const ActionBadge = ({ action }) => {
  const norm = (action || '').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700';
  if (norm === 'allowed' || norm === 'allow' || norm === 'pass') {
    colorClasses = 'bg-green-50 text-green-700';
  } else if (norm === 'blocked' || norm === 'block') {
    colorClasses = 'bg-slate-100 text-slate-700';
  } else if (norm === 'denied' || norm === 'deny') {
    colorClasses = 'bg-amber-50 text-amber-700';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClasses}`}>
      {action}
    </span>
  );
};
