import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import ResearcherLogin from './pages/auth/ResearcherLogin';
import ResearcherRegister from './pages/auth/ResearcherRegister';
import ParticipantLogin from './pages/auth/ParticipantLogin';
import ParticipantRegister from './pages/auth/ParticipantRegister';
import StudentStudyPage from './pages/student/StudentStudyPage';
import ResearcherDashboard from './pages/researcher/ResearcherDashboard';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import ExperimentBuilder from './pages/researcher/ExperimentBuilder';
import ExperimentResults from './pages/researcher/ExperimentResults';
import ExperimentRunner from './pages/experiment/ExperimentRunner';
import ParticipantsPage from './pages/researcher/ParticipantsPage';
import AnalyticsPage from './pages/researcher/AnalyticsPage';
import DataExportPage from './pages/researcher/DataExportPage';
import SettingsPage from './pages/researcher/SettingsPage';

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

      {/* Student Unique Study Links (old system) */}
      <Route path="/study/:studyCode" element={<StudentStudyPage />} />
      <Route path="/study/join" element={<StudentStudyPage />} />
      <Route path="/student/signup" element={<StudentStudyPage />} />

      {/* Participant Experiment Runner (new system) */}
      <Route path="/experiment/:publicId" element={<ExperimentRunner />} />

      {/* Protected Researcher Routes */}
      <Route
        path="/researcher/dashboard"
        element={
          <ProtectedRoute role="researcher">
            <ResearcherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/experiments/new"
        element={
          <ProtectedRoute role="researcher">
            <ExperimentBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/experiments/:id/edit"
        element={
          <ProtectedRoute role="researcher">
            <ExperimentBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/experiments/:id/results"
        element={
          <ProtectedRoute role="researcher">
            <ExperimentResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/participants"
        element={
          <ProtectedRoute role="researcher">
            <ParticipantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/analytics"
        element={
          <ProtectedRoute role="researcher">
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/export"
        element={
          <ProtectedRoute role="researcher">
            <DataExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/researcher/settings"
        element={
          <ProtectedRoute role="researcher">
            <SettingsPage />
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

