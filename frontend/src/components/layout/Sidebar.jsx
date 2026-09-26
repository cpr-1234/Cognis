import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  BarChart3,
  Download,
  HelpCircle,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV = [
  {
    group: 'GENERAL',
    items: [
      { to: '/researcher/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
      { to: '/researcher/experiments/new', icon: <FlaskConical size={16} />, label: 'New Experiment' },
      { to: '/researcher/participants', icon: <Users size={16} />, label: 'Participants' },
    ],
  },
  {
    group: 'TOOLS / RESOURCES',
    items: [
      { to: '/researcher/analytics', icon: <BarChart3 size={16} />, label: 'Analytics' },
      { to: '/researcher/export', icon: <Download size={16} />, label: 'Data Export' },
    ],
  },
  {
    group: 'SETTINGS',
    items: [
      { to: '/researcher/settings', icon: <Settings size={16} />, label: 'Settings' },
    ],
  },
];

export default function Sidebar({ role = 'researcher' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.first_name
    ? user.first_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'R';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <NavLink
          to="/researcher/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            width: '100%',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#0a0d14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid rgba(34, 211, 238, 0.25)',
              boxShadow: '0 0 16px rgba(34, 211, 238, 0.25)',
            }}
          >
            <img
              src="/cognis-logo.png"
              alt="COGNIS"
              style={{
                width: 36,
                height: 36,
                objectFit: 'cover',
                mixBlendMode: 'screen',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            COGNIS
          </span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((section) => (
          <div key={section.group} className="sidebar-section">
            <div className="sidebar-section-label">{section.group}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
                }
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || user?.first_name || 'Researcher'}</div>
            <div className="sidebar-user-email">{user?.email || ''}</div>
          </div>
        </div>
        <button className="sidebar-signout" onClick={handleLogout}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
