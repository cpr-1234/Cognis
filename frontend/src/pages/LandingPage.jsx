import { Link } from 'react-router-dom';
import { Brain, ArrowRight, FlaskConical, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    icon: '🧪',
    iconClass: 'feature-icon-purple',
    title: 'Experiment Builder',
    desc: 'Design cognitive experiments with our intuitive drag-and-drop builder. Supports reaction time, memory, and attention paradigms.',
  },
  {
    icon: '📊',
    iconClass: 'feature-icon-blue',
    title: 'Real-time Analytics',
    desc: 'Monitor participant responses and reaction times live. Export data in multiple formats for statistical analysis.',
  },
  {
    icon: '🔒',
    iconClass: 'feature-icon-green',
    title: 'Secure & IRB-Ready',
    desc: 'Built with privacy-first principles. Participant data is anonymized and protected. Fully compliant with research ethics standards.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <Link to="/" className="landing-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: '#0a0d14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid rgba(34, 211, 238, 0.25)',
              boxShadow: '0 0 14px rgba(34, 211, 238, 0.25)',
            }}
          >
            <img
              src="/cognis-logo.png"
              alt="COGNIS"
              style={{
                width: 34,
                height: 34,
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
        </Link>

        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#about" className="landing-nav-link">About</a>
          <Link to="/study/join" className="landing-nav-link" style={{ color: '#38bdf8' }}>
            Join Study
          </Link>
          <Link to="/researcher/login" className="landing-nav-link">Researcher Login</Link>
          <Link to="/researcher/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero animate-fade-in">
        <div className="landing-eyebrow">
          <Brain size={12} />
          Cognitive Science Platform
        </div>
        <h1 className="landing-hero-title">
          The Modern Platform for<br />
          <span>Cognitive Research</span>
        </h1>
        <p className="landing-hero-sub">
          Cognis empowers researchers to design, deploy, and analyze cognitive science experiments — 
          and students to participate securely under anonymized research protocols.
        </p>
        <div className="landing-hero-actions">
          <Link to="/researcher/register" className="btn btn-primary">
            Start as Researcher
            <ArrowRight size={16} />
          </Link>
          <Link to="/study/join" className="btn btn-ghost" style={{ border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}>
            Student: Join with Study Link
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features stagger-children animate-fade-in-up">
        {features.map((f) => (
          <div key={f.title} className="feature-card animate-fade-in-up">
            <div className={`feature-icon ${f.iconClass}`}>
              {f.icon}
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Role CTA */}
      <section style={{ padding: '0 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          {/* Researcher card */}
          <div style={{
            background: 'linear-gradient(135deg, #1c1c2e, #161625)',
            border: '1px solid rgba(124,106,247,0.2)',
            borderRadius: '20px',
            padding: '40px',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔬</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: '#f0f0f0' }}>
              For Researchers
            </h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '24px', lineHeight: '1.7' }}>
              Build experiments, recruit participants, and analyze results — all in one platform. 
              No coding required.
            </p>
            <Link to="/researcher/register" className="btn btn-primary btn-sm">
              Create Account <ArrowRight size={14} />
            </Link>
          </div>

          {/* Participant card */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2a1a, #161e16)',
            border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: '20px',
            padding: '40px',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🧠</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: '#f0f0f0' }}>
              For Participants
            </h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '24px', lineHeight: '1.7' }}>
              Contribute to groundbreaking cognitive research. Join experiments using a simple code 
              provided by your researcher.
            </p>
            <Link to="/participant/register" className="btn btn-ghost btn-sm">
              Join a Study <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 Cognis. Built for the advancement of cognitive science.</p>
      </footer>
    </div>
  );
}
