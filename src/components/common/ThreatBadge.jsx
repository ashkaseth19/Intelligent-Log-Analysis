import React from 'react';

export const ThreatBadge = ({ label }) => {
  const normalized = (label || '').toLowerCase();

  switch (normalized) {
    case 'benign':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 capitalize">
          benign
        </span>
      );
    case 'suspicious':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 capitalize">
          suspicious
        </span>
      );
    case 'malicious':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 capitalize">
          malicious
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
          {label}
        </span>
      );
  }
};
