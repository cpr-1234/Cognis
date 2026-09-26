import { useState } from 'react';
import { Search, Bell, Mail, History } from 'lucide-react';

export default function Topbar() {
  const [query, setQuery] = useState('');

  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <Search size={14} className="topbar-search-icon" />
        <input
          className="topbar-search-input"
          type="text"
          placeholder="Search experiments, participants…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="topbar-search-kbd">⌘ F</span>
      </div>

      {/* Right actions */}
      <div className="topbar-actions">
        <button className="topbar-icon-btn" title="History">
          <History size={16} />
        </button>
        <button className="topbar-icon-btn" title="Messages">
          <Mail size={16} />
        </button>
        <button className="topbar-icon-btn topbar-icon-btn-notif" title="Notifications">
          <Bell size={16} />
          <span className="topbar-notif-dot" />
        </button>
      </div>
    </header>
  );
}
