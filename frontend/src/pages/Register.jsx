import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",

    specialization: "",
    hospital_name: "",
    license_number: "",
    experience_years: "",
    consultation_fee: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "doctor") {
        payload.specialization = formData.specialization;
        payload.hospital_name = formData.hospital_name;
        payload.license_number = formData.license_number;
        payload.experience_years = Number(formData.experience_years || 0);
        payload.consultation_fee = Number(formData.consultation_fee || 0);
      }

      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Register response:", data);

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Registration failed",
        );
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Register error:", err);

      setError(err.message || "Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-logo">
          <span>+</span> SmartCare
        </div>

        <h1>Create Account</h1>

        <p>Join the Smart Hospital system</p>

        <form onSubmit={handleRegister}>
          <label>Full Name</label>

          <input
            type="text"
            name="full_name"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Mobile Number</label>

          <input
            type="tel"
            name="phone"
            placeholder="Enter mobile number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label>Select Role</label>

          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="patient">Patient</option>

            <option value="doctor">Doctor</option>

            <option value="nurse">Nurse</option>

            <option value="receptionist">Receptionist</option>
          </select>

          {formData.role === "doctor" && (
            <>
              <label>Specialization</label>

              <input
                type="text"
                name="specialization"
                placeholder="Example: Cardiology"
                value={formData.specialization}
                onChange={handleChange}
                required
              />

              <label>Hospital Name</label>

              <input
                type="text"
                name="hospital_name"
                placeholder="Enter hospital name"
                value={formData.hospital_name}
                onChange={handleChange}
              />

              <label>License Number</label>

              <input
                type="text"
                name="license_number"
                placeholder="Enter medical license number"
                value={formData.license_number}
                onChange={handleChange}
                required
              />

              <label>Experience (Years)</label>

              <input
                type="number"
                name="experience_years"
                placeholder="Example: 5"
                min="0"
                value={formData.experience_years}
                onChange={handleChange}
                required
              />

              <label>Consultation Fee</label>

              <input
                type="number"
                name="consultation_fee"
                placeholder="Example: 500"
                min="0"
                value={formData.consultation_fee}
                onChange={handleChange}
                required
              />
            </>
          )}

          {error && <p className="error-message">{error}</p>}

          {success && <p className="success-message">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-bottom">
          Already have an account?
          <Link to="/login">Login</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Register;
