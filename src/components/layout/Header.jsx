import React, { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onToggleSidebar }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/logs?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 gap-3">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Functional Log Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs & press Enter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Project Status Meta (hidden on small mobile screens to prevent overflow) */}
      <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-500 shrink-0">
        <span>B.Tech Capstone Project</span>
        <span className="text-slate-400">•</span>
        <span>Machine Learning Threat Detection</span>
      </div>
    </header>
  );
};
