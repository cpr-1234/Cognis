import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("roles");

  return (
    <div className="app">

      <header className="header">
        <div className="brand">
          <div className="brand-icon">🧠</div>

          <div>
            <h1>COGNILAB</h1>
            <p>Browser-Based Cognitive Research</p>
          </div>
        </div>
      </header>

      {page === "roles" && (
        <RoleSelection setPage={setPage} />
      )}

      {page === "researcher" && (
        <ResearcherLogin setPage={setPage} />
      )}

      {page === "participant" && (
        <ParticipantLogin setPage={setPage} />
      )}

    </div>
  );
}


/* =========================
   ROLE SELECTION
========================= */

function RoleSelection({ setPage }) {
  return (
    <main className="main">

      <section className="welcome">

        <div className="badge">
          RESEARCH PLATFORM
        </div>

        <h2>Welcome</h2>

        <p className="question">
          How will you participate?
        </p>

        <p className="description">
          Choose how you'd like to access the CogniLab platform.
        </p>

      </section>


      <section className="role-container">

        <button
          className="role-card"
          onClick={() => setPage("researcher")}
        >
          <div className="role-icon researcher-icon">
            🔬
          </div>

          <div className="role-info">
            <h3>Researcher</h3>

            <p>
              Create, manage and analyze
              cognitive experiments.
            </p>

            <span>Continue →</span>
          </div>
        </button>


        <button
          className="role-card"
          onClick={() => setPage("participant")}
        >
          <div className="role-icon participant-icon">
            👤
          </div>

          <div className="role-info">
            <h3>Participant</h3>

            <p>
              Take part in a research
              experiment using an experiment code.
            </p>

            <span>Continue →</span>
          </div>
        </button>

      </section>


      <div className="trust">
        <span>🔒 Secure</span>
        <span>👁 Anonymous</span>
        <span>⚡ Precise</span>
      </div>

    </main>
  );
}


/* =========================
   RESEARCHER LOGIN
========================= */

function ResearcherLogin({ setPage }) {

  function handleSubmit(event) {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    console.log("Researcher:", email);
    console.log("Password:", password);

    alert("Demo login successful!");
  }

  return (
    <main className="login-page">

      <button
        className="back-button"
        onClick={() => setPage("roles")}
      >
        ← Back
      </button>


      <div className="login-card">

        <div className="login-icon">
          🔬
        </div>

        <h2>Researcher Login</h2>

        <p>
          Sign in to create and manage experiments.
        </p>


        <form onSubmit={handleSubmit}>

          <label>Email</label>

          <input
            name="email"
            type="email"
            placeholder="researcher@example.com"
            required
          />


          <label>Password</label>

          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            required
          />


          <button
            type="submit"
            className="primary-button"
          >
            Sign In
          </button>

        </form>


        <p className="account-text">
          Don't have an account?
          <span> Create one</span>
        </p>

      </div>

    </main>
  );
}


/* =========================
   PARTICIPANT
========================= */

function ParticipantLogin({ setPage }) {

  function handleSubmit(event) {
    event.preventDefault();

    const code = event.target.code.value;

    console.log("Experiment code:", code);

    alert(`Experiment ${code} found!`);
  }

  return (
    <main className="login-page">

      <button
        className="back-button"
        onClick={() => setPage("roles")}
      >
        ← Back
      </button>


      <div className="login-card">

        <div className="login-icon">
          👤
        </div>

        <h2>Join Experiment</h2>

        <p>
          Enter the experiment code provided
          by your researcher.
        </p>


        <form onSubmit={handleSubmit}>

          <label>Experiment Code</label>

          <input
            name="code"
            type="text"
            placeholder="e.g. COG-4821"
            required
          />


          <button
            type="submit"
            className="primary-button"
          >
            Join Experiment
          </button>

        </form>


        <div className="anonymous-note">
          🔒 No account required.
          Your participation remains anonymous.
        </div>

      </div>

    </main>
  );
}


export default App;