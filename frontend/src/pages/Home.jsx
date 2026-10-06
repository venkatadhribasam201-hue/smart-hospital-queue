import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">
      {/* Navbar */}

      <nav className="navbar">
        <div className="logo">
          <span>+</span> SmartCare
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>

          <a href="#features">Features</a>

          <a href="#about">About</a>

          <Link to="/login">Login</Link>

          <Link to="/register" className="nav-register">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}

      <section className="hero">
        <div className="hero-left">
          <div className="small-heading">AI-POWERED HEALTHCARE</div>

          <h1>
            Smarter Queues.
            <br />
            <span>Better Healthcare.</span>
          </h1>

          <p>
            An intelligent hospital queue management system that helps patients,
            doctors and hospital staff manage appointments and waiting time
            efficiently.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-button">
              Get Started
            </Link>

            <Link to="/login" className="secondary-button">
              Track Your Token
            </Link>
          </div>

          <div className="hero-info">
            <div>
              <strong>AI</strong>
              <span>Waiting Prediction</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Queue Monitoring</span>
            </div>

            <div>
              <strong>All</strong>
              <span>Hospital Staff</span>
            </div>
          </div>
        </div>

        {/* Hero Card */}

        <div className="hero-right">
          <div className="hospital-card">
            <div className="card-header">
              <div>
                <p>Today's Queue</p>
                <h3>General Medicine</h3>
              </div>

              <div className="status">● Live</div>
            </div>

            <div className="queue-number">
              <span>Current Token</span>

              <strong>GM-024</strong>
            </div>

            <div className="queue-details">
              <div>
                <span>Patients Ahead</span>
                <strong>4</strong>
              </div>

              <div>
                <span>Estimated Wait</span>
                <strong>22 min</strong>
              </div>
            </div>

            <div className="progress-area">
              <div className="progress-text">
                <span>Queue Progress</span>

                <span>68%</span>
              </div>

              <div className="progress-bar">
                <div className="progress"></div>
              </div>
            </div>

            <div className="prediction">
              <div className="ai-icon">AI</div>

              <div>
                <strong>AI Prediction</strong>

                <p>Your estimated consultation time is 10:42 AM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}

      <section id="features" className="features">
        <div className="section-title">
          <p>SMART HOSPITAL SYSTEM</p>

          <h2>Everything in one place</h2>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🏥</div>

            <h3>Smart Queue</h3>

            <p>Manage patient queues and hospital tokens efficiently.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>

            <h3>AI Prediction</h3>

            <p>Predict patient waiting time using machine learning.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>

            <h3>Staff Management</h3>

            <p>Connect doctors, nurses, reception and other staff.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>

            <h3>Analytics</h3>

            <p>Monitor hospital performance through useful dashboards.</p>
          </div>
        </div>
      </section>

      {/* About */}

      <section id="about" className="about">
        <div>
          <p className="small-heading">ABOUT SMARTCARE</p>

          <h2>Making hospital visits simpler and smarter.</h2>
        </div>

        <p>
          SmartCare connects patients and hospital staff through a centralized
          digital platform. The system uses machine learning to estimate waiting
          time and helps hospitals manage patient flow more effectively.
        </p>
      </section>

      {/* Footer */}

      <footer>
        <div className="logo">
          <span>+</span> SmartCare
        </div>

        <p>AI-Driven Smart Hospital Queue Management System</p>

        <p>© 2026 SmartCare</p>
      </footer>
    </div>
  );
}

export default Home;
