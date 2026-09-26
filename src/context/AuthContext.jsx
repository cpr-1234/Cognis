import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Demo user so the dashboard renders immediately without a backend
const DEMO_USER = {
  id: '1',
  first_name: 'Dr. Pranay',
  email: 'pranay@cognis.io',
  role: 'researcher',
  avatar: null,
};

export function AuthProvider({ children }) {
  const [user] = useState(DEMO_USER);
  const [loading] = useState(false);

  const logout = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
