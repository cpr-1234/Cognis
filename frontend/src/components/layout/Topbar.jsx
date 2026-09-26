import { useState, useEffect } from 'react';
import { Search, Sun, Moon } from 'lucide-react';

export default function Topbar() {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cognis_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cognis_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

      {/* Top Right: Light / Dark Theme Toggle */}
      <div className="topbar-actions">
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '6px 12px',
            color: 'var(--text-primary)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#f59e0b" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#6366f1" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
