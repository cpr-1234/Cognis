import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import ResearcherLogin from './pages/auth/ResearcherLogin';
import ResearcherRegister from './pages/auth/ResearcherRegister';
import ParticipantLogin from './pages/auth/ParticipantLogin';
import ParticipantRegister from './pages/auth/ParticipantRegister';
import ResearcherDashboard from './pages/researcher/ResearcherDashboard';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'researcher' ? '/researcher/dashboard' : '/participant/dashboard'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#111', color: '#a0a0a0',
        fontFamily: 'Inter, sans-serif', fontSize: 14,
      }}>
        Loading Cognis...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/researcher/login" element={<ResearcherLogin />} />
      <Route path="/researcher/register" element={<ResearcherRegister />} />
      <Route path="/participant/login" element={<ParticipantLogin />} />
      <Route path="/participant/register" element={<ParticipantRegister />} />

      {/* Protected Researcher Routes */}
      <Route
        path="/researcher/dashboard"
        element={
          <ProtectedRoute role="researcher">
            <ResearcherDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Participant Routes */}
      <Route
        path="/participant/dashboard"
        element={
          <ProtectedRoute role="participant">
            <ParticipantDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
