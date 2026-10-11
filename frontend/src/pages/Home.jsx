import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Backend API URL
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://10.157.76.151:8001"
).replace(/\/+$/, "");

const FALLBACK_IMAGE = "https://placehold.co/600x350?text=Hospital";

function Home() {
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // Fetch hospitals from backend
  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    async function fetchHospitals() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/hospitals/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const result = await response.json();

        const data = Array.isArray(result)
          ? result
          : Array.isArray(result?.hospitals)
            ? result.hospitals
            : Array.isArray(result?.data)
              ? result.data
              : null;

        if (!data) {
          throw new Error("Invalid hospital data received from API.");
        }

        setHospitals(data);
      } catch (err) {
        if (err.name === "AbortError" && !timedOut) {
          return;
        }

        console.error("Hospital API error:", err);

        if (timedOut) {
          setError(
            "Request timeout. Backend running, Wi-Fi and API URL check cheyyandi.",
          );
        } else {
          setError(
            `${err.message || "Hospitals load avvaledu."} ` +
              "Backend URL, CORS and network settings check cheyyandi.",
          );
        }
      } finally {
        clearTimeout(timeoutId);

        if (!controller.signal.aborted || timedOut) {
          setLoading(false);
        }
      }
    }

    fetchHospitals();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [retry]);

  // Get unique cities
  const cities = useMemo(() => {
    return [
      ...new Set(hospitals.map((hospital) => hospital.city).filter(Boolean)),
    ].sort();
  }, [hospitals]);

  // Search and filter hospitals
  const filteredHospitals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      const matchesSearch =
        !keyword ||
        [hospital.name, hospital.city, hospital.state, hospital.address].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword),
        );

      const matchesCity =
        !city ||
        String(hospital.city || "").toLowerCase() === city.toLowerCase();

      return matchesSearch && matchesCity;
    });
  }, [hospitals, search, city]);

  // Build a hospital-specific login URL
  const getHospitalLoginUrl = (hospital) => {
    if (hospital.id === undefined || hospital.id === null) {
      return "/login";
    }

    return `/login?hospital_id=${encodeURIComponent(hospital.id)}`;
  };

  return (
    <div className="home">
      <style>{`
        .home {
          width: 100%;
          overflow-x: hidden;
        }

        .hospital-section {
          padding: 70px 6%;
          background: #f7fafc;
          box-sizing: border-box;
        }

        .hospital-heading {
          text-align: center;
          margin-bottom: 30px;
        }

        .hospital-heading p {
          color: #0d9488;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .hospital-heading h2 {
          font-size: clamp(26px, 4vw, 36px);
          color: #163344;
          margin: 10px 0;
        }

        .hospital-heading .hospital-subtitle {
          color: #64748b;
          letter-spacing: 0;
          font-weight: 400;
          font-size: 15px;
        }

        .hospital-filters {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 25px auto 35px;
          max-width: 800px;
        }

        .hospital-filters input,
        .hospital-filters select {
          box-sizing: border-box;
          padding: 13px 15px;
          border: 1px solid #dbe4ec;
          border-radius: 10px;
          background: #fff;
          color: #163344;
          font-size: 16px;
          min-width: 0;
          flex: 1;
          width: 100%;
          outline-color: #0d9488;
        }

        .hospital-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 260px), 1fr)
          );
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hospital-item {
          min-width: 0;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5edf2;
          box-shadow: 0 5px 20px rgba(15, 50, 70, 0.06);
        }

        .hospital-item img {
          width: 100%;
          height: 190px;
          object-fit: cover;
          display: block;
          background: #e2e8f0;
        }

        .hospital-item-content {
          padding: 20px;
          overflow-wrap: anywhere;
        }

        .hospital-item-content h3 {
          font-size: 19px;
          line-height: 1.4;
          color: #163344;
          margin: 0 0 12px;
        }

        .hospital-location {
          color: #64748b;
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 18px;
        }

        .hospital-badge {
          display: inline-block;
          background: #e6f7f3;
          color: #087f70;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 20px;
          margin-bottom: 12px;
        }

        .hospital-details-link {
          display: inline-block;
          color: #087f70;
          font-weight: 700;
          text-decoration: none;
          padding: 10px 0;
        }

        .hospital-details-link:hover {
          text-decoration: underline;
        }

        .hospital-message {
          text-align: center;
          color: #64748b;
          padding: 30px 10px;
          grid-column: 1 / -1;
          overflow-wrap: anywhere;
        }

        .hospital-error {
          color: #b91c1c;
        }

        .hospital-retry {
          background: #087f70;
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 13px 20px;
          margin-top: 12px;
          font-size: 16px;
          cursor: pointer;
        }

        .hospital-retry:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .hospital-section {
            padding: 42px 5%;
          }

          .hospital-filters {
            flex-direction: column;
            gap: 12px;
          }

          .hospital-filters input,
          .hospital-filters select {
            width: 100%;
            flex: none;
          }

          .hospital-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .hospital-item img {
            height: 200px;
          }

          .hospital-item-content {
            padding: 16px;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>+</span> SmartCare
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#hospitals">Hospitals</a>
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-register">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero section */}
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

        {/* Demo queue card */}
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

      {/* Hospital list */}
      <section id="hospitals" className="hospital-section">
        <div className="hospital-heading">
          <p>FIND YOUR HOSPITAL</p>
          <h2>Hospitals Near You</h2>
          <p className="hospital-subtitle">
            Search hospitals and explore available facilities.
          </p>
        </div>

        <div className="hospital-filters">
          <input
            type="search"
            placeholder="Search hospital or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search hospitals"
          />

          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="Filter by city"
          >
            <option value="">All Cities</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </div>

        <div className="hospital-grid">
          {loading && <p className="hospital-message">Loading hospitals...</p>}

          {!loading && error && (
            <div className="hospital-message hospital-error">
              <p>{error}</p>
              <p>
                API: <strong>{API_BASE_URL}/hospitals/</strong>
              </p>
              <button
                type="button"
                className="hospital-retry"
                onClick={() => setRetry((value) => value + 1)}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredHospitals.length === 0 && (
            <p className="hospital-message">
              {hospitals.length === 0
                ? "No hospitals are available right now."
                : "No hospitals found. Try another search."}
            </p>
          )}

          {!loading &&
            !error &&
            filteredHospitals.map((hospital, index) => (
              <article
                className="hospital-item"
                key={hospital.id ?? hospital.name ?? index}
              >
                <img
                  src={hospital.image_url || FALLBACK_IMAGE}
                  alt={hospital.name || "Hospital"}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                <div className="hospital-item-content">
                  <span className="hospital-badge">Hospital</span>

                  <h3>{hospital.name || "Hospital"}</h3>

                  <div className="hospital-location">
                    <div>
                      📍{" "}
                      {hospital.address ||
                        hospital.city ||
                        "Location unavailable"}
                    </div>

                    {hospital.city && hospital.state && (
                      <div>
                        {hospital.city}, {hospital.state}
                      </div>
                    )}

                    {hospital.phone && <div>☎ {hospital.phone}</div>}
                  </div>

                  <Link
                    to={getHospitalLoginUrl(hospital)}
                    className="hospital-details-link"
                  >
                    Login to Continue →
                  </Link>
                </div>
              </article>
            ))}
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
