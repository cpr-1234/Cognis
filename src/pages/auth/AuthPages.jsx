import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

function AuthPage({ title, subtitle, linkTo, linkLabel, linkText }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-icon">
            <Brain size={16} color="#fff" />
          </div>
          <span className="sidebar-logo-text">Cognis</span>
        </div>
        <div className="auth-title">{title}</div>
        <div className="auth-sub">{subtitle}</div>
        <div className="auth-field">
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" placeholder="you@university.edu" />
        </div>
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" placeholder="••••••••" />
        </div>
        <button className="auth-submit">{title}</button>
        <div className="auth-link-row">
          {linkText} <Link to={linkTo}>{linkLabel}</Link>
        </div>
      </div>
    </div>
  );
}

export function ResearcherLogin() {
  return (
    <AuthPage
      title="Researcher Login"
      subtitle="Access your research command center"
      linkTo="/researcher/register"
      linkLabel="Create account"
      linkText="New researcher?"
    />
  );
}

export function ResearcherRegister() {
  return (
    <AuthPage
      title="Researcher Sign Up"
      subtitle="Start building cognitive experiments"
      linkTo="/researcher/login"
      linkLabel="Sign in"
      linkText="Already have an account?"
    />
  );
}

export function ParticipantLogin() {
  return (
    <AuthPage
      title="Participant Login"
      subtitle="Continue your study session"
      linkTo="/participant/register"
      linkLabel="Register"
      linkText="New participant?"
    />
  );
}

export function ParticipantRegister() {
  return (
    <AuthPage
      title="Participant Sign Up"
      subtitle="Join a cognitive study with your access code"
      linkTo="/participant/login"
      linkLabel="Sign in"
      linkText="Already registered?"
    />
  );
}
