import React from 'react';

export const StatCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="h-3 w-20 bg-slate-200 rounded"></div>
      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
    </div>
    <div className="h-7 w-28 bg-slate-200 rounded mb-2"></div>
    <div className="h-2.5 w-36 bg-slate-100 rounded"></div>
  </div>
);

export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-sm animate-pulse ${height} flex flex-col justify-between`}>
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
      <div className="h-4 w-36 bg-slate-200 rounded"></div>
      <div className="h-3 w-20 bg-slate-100 rounded"></div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full h-3/4 flex items-end gap-3 px-6 pb-2">
        <div className="w-1/6 h-1/3 bg-slate-200 rounded-t"></div>
        <div className="w-1/6 h-2/3 bg-slate-200 rounded-t"></div>
        <div className="w-1/6 h-1/2 bg-slate-200 rounded-t"></div>
        <div className="w-1/6 h-4/5 bg-slate-200 rounded-t"></div>
        <div className="w-1/6 h-3/5 bg-slate-200 rounded-t"></div>
        <div className="w-1/6 h-full bg-slate-200 rounded-t"></div>
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 6 }) => (
  <div className="w-full animate-pulse">
    <div className="border-b border-slate-200 pb-3 mb-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-200 rounded flex-1"></div>
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center py-2.5 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-3 bg-slate-100 rounded ${
                cIdx === 0 ? 'w-20' : cIdx === 1 ? 'w-28' : 'flex-1'
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = ({ height = 'h-32' }) => (
  <div className={`bg-white border border-slate-200 rounded-lg p-4 shadow-sm animate-pulse ${height} space-y-3`}>
    <div className="h-4 w-32 bg-slate-200 rounded"></div>
    <div className="h-3 w-48 bg-slate-100 rounded"></div>
    <div className="h-6 w-24 bg-slate-200 rounded mt-2"></div>
  </div>
);
