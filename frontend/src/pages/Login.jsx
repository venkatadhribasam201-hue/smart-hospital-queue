
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../api";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hospital selected on the Home page
  const hospitalId = searchParams.get("hospital_id");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Login API using the configured backend URL
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      // Handle responses that may not contain valid JSON
      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from login server.");
      }

      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Invalid email or password"
        );
      }

      // Get user information
      const user = data.user || data;

      const userId = data.user_id ?? user.user_id ?? user.id;
      const userRole = String(
        data.role ?? user.role ?? ""
      ).toLowerCase();

      const userEmail = data.email ?? user.email ?? email.trim();
      const userName = data.full_name ?? user.full_name ?? "";

      const patientId = data.patient_id ?? user.patient_id;
      const doctorId = data.doctor_id ?? user.doctor_id;

      // Validate role and required profile ID
      if (
        userRole === "patient" &&
        (patientId === undefined || patientId === null)
      ) {
        throw new Error("Patient ID not found.");
      }

      if (
        userRole === "doctor" &&
        (doctorId === undefined || doctorId === null)
      ) {
        throw new Error("Doctor ID not found.");
      }

      if (
        !["patient", "doctor", "nurse", "receptionist"].includes(userRole)
      ) {
        throw new Error("User role not found or unsupported.");
      }

      // Clear previous user's login information
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("patientId");
      localStorage.removeItem("doctorId");

      // Save selected hospital, if provided
      if (hospitalId !== null && hospitalId.trim() !== "") {
        localStorage.setItem("selectedHospitalId", hospitalId);
      } else {
        localStorage.removeItem("selectedHospitalId");
      }

      // Save common user details
      if (userId !== undefined && userId !== null) {
        localStorage.setItem("userId", String(userId));
      }

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userEmail", userEmail);

      if (userName) {
        localStorage.setItem("userName", userName);
      }

      if (data.access_token) {
        localStorage.setItem("accessToken", data.access_token);
      }

      if (patientId !== undefined && patientId !== null) {
        localStorage.setItem("patientId", String(patientId));
      }

      if (doctorId !== undefined && doctorId !== null) {
        localStorage.setItem("doctorId", String(doctorId));
      }

      // Debug information
      console.log("User ID:", userId);
      console.log("User Name:", userName);
      console.log("User Role:", userRole);
      console.log("Patient ID:", patientId);
      console.log("Doctor ID:", doctorId);
      console.log("Selected Hospital ID:", hospitalId);

      // Role-based navigation
      if (userRole === "doctor") {
        navigate("/doctor-dashboard", { replace: true });
      } else if (userRole === "patient") {
        navigate("/patient-dashboard", { replace: true });
      } else if (userRole === "nurse") {
        setError("Nurse dashboard is not available yet.");
      } else if (userRole === "receptionist") {
        setError("Receptionist dashboard is not available yet.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
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

        {hospitalId !== null && (
          <p className="selected-hospital">
            Selected Hospital ID: <strong>{hospitalId}</strong>
          </p>
        )}

        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">Email Address</label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

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
