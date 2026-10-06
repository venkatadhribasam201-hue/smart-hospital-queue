import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Invalid email or password",
        );
      }

      // =================================================
      // CLEAR OLD LOGIN DATA
      // =================================================

      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("patientId");
      localStorage.removeItem("doctorId");

      // =================================================
      // GET USER DATA
      // =================================================

      const user = data.user || data;

      // =================================================
      // COMMON USER DATA
      // =================================================

      const userId = data.user_id ?? user.user_id ?? user.id;

      const userRole = data.role ?? user.role ?? "";

      const userEmail = data.email ?? user.email ?? email;

      const userName = data.full_name ?? user.full_name ?? "";

      // =================================================
      // SAVE USER NAME
      // =================================================

      if (userName) {
        localStorage.setItem("userName", userName);
      }

      // =================================================
      // SAVE USER ID
      // =================================================

      if (userId) {
        localStorage.setItem("userId", String(userId));
      }

      // =================================================
      // SAVE ROLE
      // =================================================

      localStorage.setItem("userRole", userRole);

      // =================================================
      // SAVE EMAIL
      // =================================================

      localStorage.setItem("userEmail", userEmail);

      // =================================================
      // SAVE ACCESS TOKEN
      // =================================================

      if (data.access_token) {
        localStorage.setItem("accessToken", data.access_token);
      }

      // =================================================
      // PATIENT ID
      // =================================================

      const patientId = data.patient_id ?? user.patient_id;

      if (patientId) {
        localStorage.setItem("patientId", String(patientId));
      }

      // =================================================
      // DOCTOR ID
      // =================================================

      const doctorId = data.doctor_id ?? user.doctor_id;

      if (doctorId) {
        localStorage.setItem("doctorId", String(doctorId));
      }

      // =================================================
      // DEBUG
      // =================================================

      console.log("User ID:", userId);
      console.log("User Name:", userName);
      console.log("User Role:", userRole);
      console.log("Patient ID:", patientId);
      console.log("Doctor ID:", doctorId);

      // =================================================
      // ROLE BASED NAVIGATION
      // =================================================

      if (userRole === "doctor") {
        if (!doctorId) {
          setError("Doctor ID not found.");
          return;
        }

        navigate("/doctor-dashboard");
      } else if (userRole === "patient") {
        if (!patientId) {
          setError("Patient ID not found.");
          return;
        }

        navigate("/patient-dashboard");
      } else if (userRole === "nurse") {
        setError("Nurse dashboard is not available yet.");
      } else if (userRole === "receptionist") {
        setError("Receptionist dashboard is not available yet.");
      } else {
        setError("User role not found.");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>+</span> SmartCare
        </div>

        <h1>Welcome Back</h1>

        <p>Login to your SmartCare account</p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-bottom">
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;
