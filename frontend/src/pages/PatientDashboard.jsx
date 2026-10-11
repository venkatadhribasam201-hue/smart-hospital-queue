import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getQueue,
  getAppointments,
  getDoctors,
  getDepartments,
} from "../services/api";

import "./PatientDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://nw48n1b1-8000.inc1.devtunnels.ms";

function PatientDashboard() {
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));
  const patientId = Number(localStorage.getItem("patientId"));
  const selectedHospitalId = Number(localStorage.getItem("selectedHospitalId"));

  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || "Patient",
  );

  const [queue, setQueue] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [labReports, setLabReports] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [showLabReports, setShowLabReports] = useState(false);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState("");

  const [vitals, setVitals] = useState([]);
  const [showVitals, setShowVitals] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState("");

  const [consultations, setConsultations] = useState([]);
  const [showConsultations, setShowConsultations] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationError, setConsultationError] = useState("");

  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const [medicalHistory, setMedicalHistory] = useState([]);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false);
  const [medicalHistoryError, setMedicalHistoryError] = useState("");

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("");

  const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const text = await response.text();

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text };
    }

    if (!response.ok) {
      const detail = data.detail;
      const errorText = Array.isArray(detail)
        ? detail.map((item) => item.msg || "Validation error").join(", ")
        : typeof detail === "string"
          ? detail
          : `Request failed (${response.status})`;

      throw new Error(errorText);
    }

    return data;
  };

  const loadUserName = () => {
    const name = localStorage.getItem("userName");
    setUserName(name?.trim() || "Patient");
  };

  const handleLogout = () => {
    [
      "userId",
      "userRole",
      "userEmail",
      "accessToken",
      "patientId",
      "doctorId",
      "userName",
      "selectedHospitalId",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login");
  };

  // ---------------- DASHBOARD DATA ----------------

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!Number.isInteger(selectedHospitalId) || selectedHospitalId <= 0) {
        throw new Error(
          "Hospital not selected. Please select a hospital and log in again.",
        );
      }

      const [
        queueResponse,
        appointmentResponse,
        departmentResponse,
        doctorResponse,
      ] = await Promise.all([
        getQueue(),
        getAppointments(selectedHospitalId),
        getDepartments(selectedHospitalId),
        getDoctors(selectedHospitalId),
      ]);

      const queueData = Array.isArray(queueResponse) ? queueResponse : [];
      const appointmentData = Array.isArray(appointmentResponse)
        ? appointmentResponse
        : [];
      const departmentData = Array.isArray(departmentResponse)
        ? departmentResponse
        : [];
      const doctorData = Array.isArray(doctorResponse) ? doctorResponse : [];

      // Never show appointments belonging to another hospital.
      const hospitalAppointments = appointmentData.filter(
        (item) =>
          Number(item.patient_id) === patientId &&
          Number(item.hospital_id) === selectedHospitalId,
      );

      // Departments must explicitly belong to the selected hospital.
      const hospitalDepartments = departmentData.filter(
        (item) => Number(item.hospital_id) === selectedHospitalId,
      );

      const departmentIds = new Set(
        hospitalDepartments.map((item) => Number(item.id)),
      );

      // Doctors must belong to the hospital and its departments.
      const hospitalDoctors = doctorData.filter(
        (doctor) =>
          Number(doctor.hospital_id) === selectedHospitalId &&
          departmentIds.has(Number(doctor.department_id)),
      );

      const appointmentIds = new Set(
        hospitalAppointments.map((item) => Number(item.id)),
      );

      const hospitalQueue = queueData.filter(
        (item) =>
          Number(item.patient_id) === patientId &&
          appointmentIds.has(Number(item.appointment_id)),
      );

      const activeQueues = hospitalQueue.filter(
        (item) => item.status === "waiting" || item.status === "serving",
      );

      setQueue(
        activeQueues.length
          ? activeQueues[activeQueues.length - 1]
          : hospitalQueue.length
            ? hospitalQueue[hospitalQueue.length - 1]
            : null,
      );

      setAppointments(hospitalAppointments);
      setDepartments(hospitalDepartments);
      setDoctors(hospitalDoctors);

      console.log("Selected hospital:", selectedHospitalId);
      console.log("Hospital departments:", hospitalDepartments);
      console.log("Hospital doctors:", hospitalDoctors);
      console.log("Hospital appointments:", hospitalAppointments);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedHospitalId]);

  // ---------------- NOTIFICATIONS ----------------

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("User ID not found. Please log in again.");
      }

      const data = await apiFetch(`/notifications/user/${userId}`);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notification error:", err);
      setNotificationError(err.message || "Failed to load notifications");
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleNotifications = async () => {
    setShowNotifications(true);
    await loadNotifications();
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiFetch(`/notifications/${notificationId}/read`, {
        method: "PUT",
      });
      await loadNotifications();
    } catch (err) {
      setNotificationError(err.message || "Could not update notification");
    }
  };

  // ---------------- LAB REPORTS ----------------

  const loadLabReports = async () => {
    try {
      setLabLoading(true);
      setLabError("");

      const [reportsData, testsData] = await Promise.all([
        apiFetch("/lab-reports/"),
        apiFetch("/lab-tests/"),
      ]);

      setLabReports(
        Array.isArray(reportsData)
          ? reportsData.filter((item) => Number(item.patient_id) === patientId)
          : [],
      );
      setLabTests(Array.isArray(testsData) ? testsData : []);
    } catch (err) {
      setLabError(err.message || "Failed to load lab reports");
    } finally {
      setLabLoading(false);
    }
  };

  const getLabTestName = (labTestId) => {
    const test = labTests.find((item) => Number(item.id) === Number(labTestId));
    return test ? test.test_name : `Lab Test ${labTestId}`;
  };

  const handleLabReports = async () => {
    setShowLabReports(true);
    await loadLabReports();
  };

  // ---------------- VITALS ----------------

  const loadVitals = async () => {
    try {
      setVitalsLoading(true);
      setVitalsError("");

      const data = await apiFetch(`/vitals/patient/${patientId}`);
      setVitals(Array.isArray(data) ? data : []);
    } catch (err) {
      setVitalsError(err.message || "Failed to load vitals");
    } finally {
      setVitalsLoading(false);
    }
  };

  const handleVitals = async () => {
    setShowVitals(true);
    await loadVitals();
  };

  // ---------------- CONSULTATIONS ----------------

  const loadConsultations = async () => {
    try {
      setConsultationLoading(true);
      setConsultationError("");

      const data = await apiFetch("/consultations/");
      setConsultations(
        Array.isArray(data)
          ? data.filter((item) => Number(item.patient_id) === patientId)
          : [],
      );
    } catch (err) {
      setConsultationError(err.message || "Failed to load consultations");
    } finally {
      setConsultationLoading(false);
    }
  };

  const handleConsultations = async () => {
    setShowConsultations(true);
    await loadConsultations();
  };

  // ---------------- PRESCRIPTIONS ----------------

  const loadPrescriptions = async () => {
    try {
      setPrescriptionLoading(true);
      setPrescriptionError("");

      const data = await apiFetch("/prescriptions/");
      setPrescriptions(
        Array.isArray(data)
          ? data.filter((item) => Number(item.patient_id) === patientId)
          : [],
      );
    } catch (err) {
      setPrescriptionError(err.message || "Failed to load prescriptions");
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handlePrescriptions = async () => {
    setShowPrescriptions(true);
    await loadPrescriptions();
  };

  // ---------------- MEDICAL HISTORY ----------------

  const getHistoryDate = (value) =>
    value ? String(value).split("T")[0] : "Not available";

  const loadMedicalHistory = async () => {
    try {
      setMedicalHistoryLoading(true);
      setMedicalHistoryError("");

      const [consultationData, prescriptionData, vitalsData, labReportsData] =
        await Promise.all([
          apiFetch("/consultations/"),
          apiFetch("/prescriptions/"),
          apiFetch(`/vitals/patient/${patientId}`),
          apiFetch("/lab-reports/"),
        ]);

      const patientConsultations = Array.isArray(consultationData)
        ? consultationData.filter(
            (item) => Number(item.patient_id) === patientId,
          )
        : [];

      const patientPrescriptions = Array.isArray(prescriptionData)
        ? prescriptionData.filter(
            (item) => Number(item.patient_id) === patientId,
          )
        : [];

      const patientVitals = Array.isArray(vitalsData) ? vitalsData : [];

      const patientLabReports = Array.isArray(labReportsData)
        ? labReportsData.filter((item) => Number(item.patient_id) === patientId)
        : [];

      const historyMap = {};

      const ensureDate = (date) => {
        if (!historyMap[date]) {
          historyMap[date] = {
            date,
            doctorIds: [],
            consultations: [],
            prescriptions: [],
            vitals: [],
            labReports: [],
          };
        }
        return historyMap[date];
      };

      patientConsultations.forEach((item) => {
        const entry = ensureDate(getHistoryDate(item.consultation_date));
        if (
          item.doctor_id &&
          !entry.doctorIds.includes(Number(item.doctor_id))
        ) {
          entry.doctorIds.push(Number(item.doctor_id));
        }
        entry.consultations.push(item);
      });

      patientPrescriptions.forEach((item) => {
        const entry = ensureDate(getHistoryDate(item.prescribed_at));
        if (
          item.doctor_id &&
          !entry.doctorIds.includes(Number(item.doctor_id))
        ) {
          entry.doctorIds.push(Number(item.doctor_id));
        }
        entry.prescriptions.push(item);
      });

      patientVitals.forEach((item) => {
        ensureDate(getHistoryDate(item.recorded_at)).vitals.push(item);
      });

      patientLabReports.forEach((item) => {
        ensureDate(getHistoryDate(item.report_date)).labReports.push(item);
      });

      setMedicalHistory(
        Object.values(historyMap).sort((a, b) => {
          if (a.date === "Not available") return 1;
          if (b.date === "Not available") return -1;
          return new Date(b.date) - new Date(a.date);
        }),
      );
    } catch (err) {
      setMedicalHistoryError(err.message || "Failed to load medical history");
    } finally {
      setMedicalHistoryLoading(false);
    }
  };

  const handleMedicalHistory = async () => {
    setShowMedicalHistory(true);
    await loadMedicalHistory();
  };

  // ---------------- BOOK APPOINTMENT ----------------

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!Number.isInteger(selectedHospitalId) || selectedHospitalId <= 0) {
      setError("Hospital not selected. Please log in again.");
      return;
    }

    if (
      !selectedDepartment ||
      !selectedDoctor ||
      !appointmentDate ||
      !reason.trim()
    ) {
      setError("Please complete all appointment fields.");
      return;
    }

    const doctor = doctors.find(
      (item) => Number(item.id) === Number(selectedDoctor),
    );

    const department = departments.find(
      (item) => Number(item.id) === Number(selectedDepartment),
    );

    if (
      !doctor ||
      !department ||
      Number(doctor.hospital_id) !== selectedHospitalId ||
      Number(department.hospital_id) !== selectedHospitalId ||
      Number(doctor.department_id) !== Number(selectedDepartment)
    ) {
      setError(
        "Selected doctor or department does not belong to this hospital.",
      );
      return;
    }

    try {
      setBooking(true);

      const appointmentData = await apiFetch("/appointments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: Number(selectedDoctor),
          department_id: Number(selectedDepartment),
          hospital_id: selectedHospitalId,
          appointment_date: appointmentDate,
          reason: reason.trim(),
          status: "scheduled",
        }),
      });

      const appointmentId = Number(
        appointmentData.appointment_id ?? appointmentData.id,
      );

      if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
        throw new Error(
          "Appointment created, but the API did not return its ID.",
        );
      }

      const queueData = await apiFetch("/queue/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointmentId,
          patient_id: patientId,
          doctor_id: Number(selectedDoctor),
          queue_date: appointmentDate,
          estimated_waiting_time: 0,
        }),
      });

      try {
        await apiFetch("/notifications/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            title: "Queue Token Generated",
            message: `Your queue token is ${queueData.token_number}. Estimated waiting time: ${queueData.estimated_waiting_time ?? 0} minutes.`,
            notification_type: "queue",
            is_read: false,
          }),
        });
      } catch (err) {
        console.error("Notification creation failed:", err);
      }

      setMessage(
        `Appointment booked successfully. Queue Token: ${queueData.token_number ?? "Created"}. Estimated waiting time: ${queueData.estimated_waiting_time ?? 0} minutes.`,
      );

      setSelectedDepartment("");
      setSelectedDoctor("");
      setAppointmentDate("");
      setReason("");

      await Promise.all([loadDashboard(), loadNotifications()]);
    } catch (err) {
      console.error("Appointment booking error:", err);
      setError(err.message || "Appointment booking failed");
    } finally {
      setBooking(false);
    }
  };

  // ---------------- LOOKUPS ----------------

  const filteredDoctors = doctors.filter(
    (doctor) =>
      selectedDepartment &&
      Number(doctor.department_id) === Number(selectedDepartment) &&
      Number(doctor.hospital_id) === selectedHospitalId,
  );

  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (item) => Number(item.id) === Number(departmentId),
    );
    return department ? department.name : `Department ${departmentId}`;
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((item) => Number(item.id) === Number(doctorId));

    if (!doctor) return `Doctor ${doctorId}`;

    return (
      doctor.name ||
      doctor.full_name ||
      doctor.doctor_name ||
      `Doctor ${doctorId}`
    );
  };

  const getHistoryDoctors = (doctorIds) => {
    if (!Array.isArray(doctorIds) || !doctorIds.length) {
      return "Not available";
    }
    return doctorIds.map(getDoctorName).join(", ");
  };

  const unreadNotifications = notifications.filter(
    (item) => !item.is_read,
  ).length;

  // ---------------- INITIAL LOAD ----------------

  useEffect(() => {
    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(patientId) ||
      patientId <= 0
    ) {
      navigate("/login");
      return;
    }

    loadUserName();
    loadDashboard();
    loadNotifications();
  }, [userId, patientId, navigate, loadDashboard]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <h2>Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h1>🏥 Smart Hospital</h1>
            <p className="welcome">Welcome, {userName} 👋</p>
            <p>Selected Hospital ID: {selectedHospitalId || "Not selected"}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={handleNotifications}>
              🔔 Notifications{" "}
              {unreadNotifications > 0 && `(${unreadNotifications})`}
            </button>
            <button type="button" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </header>

        {error && <div className="error-message">❌ {error}</div>}
        {message && <div className="success-message">{message}</div>}

        <section className="dashboard-card">
          <h2>📅 Book Appointment</h2>
          <form onSubmit={handleBookAppointment} className="appointment-form">
            <label>Select Department</label>
            <select
              value={selectedDepartment}
              onChange={(event) => {
                setSelectedDepartment(event.target.value);
                setSelectedDoctor("");
                setError("");
                setMessage("");
              }}
              required
            >
              <option value="">Select Department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <label>Select Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(event) => setSelectedDoctor(event.target.value)}
              disabled={!selectedDepartment}
              required
            >
              <option value="">Select Doctor</option>
              {filteredDoctors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ||
                    item.full_name ||
                    item.doctor_name ||
                    `Doctor ${item.id}`}
                </option>
              ))}
            </select>

            {selectedDepartment && (
              <p>
                {filteredDoctors.length
                  ? `${filteredDoctors.length} doctor(s) available`
                  : "No doctors available for this department."}
              </p>
            )}

            <label>Appointment Date</label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => setAppointmentDate(event.target.value)}
              required
            />

            <label>Reason for Visit</label>
            <textarea
              placeholder="Enter your symptoms or reason for visit"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              required
            />

            <button className="book-button" type="submit" disabled={booking}>
              {booking ? "Booking..." : "📅 Book Appointment"}
            </button>
          </form>
        </section>

        <section className="dashboard-card">
          <h2>🎫 My Queue</h2>
          {queue ? (
            <>
              <div className="queue-details">
                <div>
                  <span>Queue Token</span>
                  <strong>{queue.token_number}</strong>
                </div>
                <div>
                  <span>Appointment ID</span>
                  <strong>{queue.appointment_id}</strong>
                </div>
                <div>
                  <span>Doctor</span>
                  <strong>{getDoctorName(queue.doctor_id)}</strong>
                </div>
                <div>
                  <span>Queue Date</span>
                  <strong>
                    {queue.queue_date?.split("T")[0] || "Not available"}
                  </strong>
                </div>
                <div>
                  <span>Patients Ahead</span>
                  <strong>{queue.patients_ahead ?? 0}</strong>
                </div>
                <div>
                  <span>Estimated Wait</span>
                  <strong>{queue.estimated_waiting_time ?? 0} minutes</strong>
                </div>
              </div>
              <p className="dashboard-status">{queue.status || "waiting"}</p>
              {queue.status === "waiting" && (
                <p>⏳ Please wait for your turn.</p>
              )}
              {queue.status === "serving" && (
                <p>🟢 It is your turn. Please proceed to the doctor.</p>
              )}
              {queue.status === "completed" && (
                <p>✅ Your consultation has been completed.</p>
              )}
              {queue.status === "cancelled" && (
                <p>❌ Your queue token has been cancelled.</p>
              )}
            </>
          ) : (
            <p>No queue found for appointments at this hospital.</p>
          )}
        </section>

        <section className="dashboard-card">
          <h2>📋 My Appointments</h2>
          {appointments.length === 0 ? (
            <p>No appointments found for this hospital.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((item) => (
                <div className="appointment-item" key={item.id}>
                  <h3>Appointment {item.id}</h3>
                  <p>
                    <strong>Department:</strong>{" "}
                    {getDepartmentName(item.department_id)}
                  </p>
                  <p>
                    <strong>Doctor:</strong> {getDoctorName(item.doctor_id)}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {item.appointment_date?.split("T")[0] || "Not available"}
                  </p>
                  <p>
                    <strong>Reason:</strong> {item.reason}
                  </p>
                  <span className="appointment-status">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <h2>🩺 Medical Information</h2>
          <div className="medical-grid">
            <button type="button" onClick={handleVitals}>
              ❤️ Vitals
            </button>
            <button type="button" onClick={handleConsultations}>
              🩺 Consultation
            </button>
            <button type="button" onClick={handlePrescriptions}>
              💊 Prescription
            </button>
            <button type="button" onClick={handleLabReports}>
              🧪 Lab Reports
            </button>
            <button type="button" onClick={handleMedicalHistory}>
              📋 Medical History
            </button>
          </div>
        </section>

        {showNotifications && (
          <section className="dashboard-card">
            <PanelHeader
              title="🔔 My Notifications"
              onClose={() => setShowNotifications(false)}
            />
            {notificationLoading && <p>Loading notifications...</p>}
            {notificationError && (
              <p className="error-message">{notificationError}</p>
            )}
            {!notificationLoading &&
              !notificationError &&
              notifications.length === 0 && <p>No notifications available.</p>}
            {notifications.map((item) => (
              <div className="appointment-item" key={item.id}>
                <h3>
                  {item.is_read ? "📩" : "🔵"} {item.title}
                </h3>
                <p>{item.message}</p>
                <p>Type: {item.notification_type || "General"}</p>
                <p>Date: {item.created_at?.split("T")[0] || "Not available"}</p>
                {!item.is_read && (
                  <button
                    type="button"
                    onClick={() => markNotificationAsRead(item.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </section>
        )}

        {showMedicalHistory && (
          <section className="dashboard-card">
            <PanelHeader
              title="📋 My Medical History"
              onClose={() => setShowMedicalHistory(false)}
            />
            {medicalHistoryLoading && <p>Loading medical history...</p>}
            {medicalHistoryError && (
              <p className="error-message">{medicalHistoryError}</p>
            )}
            {!medicalHistoryLoading &&
              !medicalHistoryError &&
              medicalHistory.length === 0 && (
                <p>No medical history available.</p>
              )}
            {medicalHistory.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Doctor",
                        "Consultation",
                        "Prescription",
                        "Vitals",
                        "Lab Report",
                      ].map((label) => (
                        <th
                          key={label}
                          style={{
                            padding: 12,
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {medicalHistory.map((item, index) => (
                      <tr key={`${item.date}-${index}`}>
                        <td style={cellStyle}>{item.date}</td>
                        <td style={cellStyle}>
                          {getHistoryDoctors(item.doctorIds)}
                        </td>
                        <td style={cellStyle}>
                          {item.consultations.map((x) => (
                            <p key={x.id}>
                              Diagnosis: {x.diagnosis || "Not available"}
                              <br />
                              Symptoms: {x.symptoms || "Not available"}
                            </p>
                          ))}
                        </td>
                        <td style={cellStyle}>
                          {item.prescriptions.map((x) => (
                            <p key={x.id}>
                              {x.medicine_name || "Medicine"}
                              <br />
                              Dosage: {x.dosage || "N/A"}
                              <br />
                              Frequency: {x.frequency || "N/A"}
                              <br />
                              Duration: {x.duration || "N/A"}
                            </p>
                          ))}
                        </td>
                        <td style={cellStyle}>
                          {item.vitals.map((x) => (
                            <p key={x.id}>
                              Temperature: {x.temperature ?? "N/A"} °F
                              <br />
                              Blood Pressure: {x.blood_pressure || "N/A"}
                              <br />
                              Heart Rate: {x.heart_rate ?? "N/A"} bpm
                              <br />
                              Oxygen: {x.oxygen_level ?? "N/A"}%
                            </p>
                          ))}
                        </td>
                        <td style={cellStyle}>
                          {item.labReports.map((x) => (
                            <p key={x.id}>
                              {getLabTestName(x.lab_test_id)}
                              <br />
                              Result: {x.result || "N/A"}
                              <br />
                              Value: {x.result_value || "N/A"}
                              <br />
                              Status: {x.report_status || "N/A"}
                            </p>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {showConsultations && (
          <section className="dashboard-card">
            <PanelHeader
              title="🩺 My Consultations"
              onClose={() => setShowConsultations(false)}
            />
            {consultationLoading && <p>Loading consultations...</p>}
            {consultationError && (
              <p className="error-message">{consultationError}</p>
            )}
            {!consultationLoading &&
              !consultationError &&
              consultations.length === 0 && (
                <p>No consultation records available.</p>
              )}
            {consultations.map((item) => (
              <div className="appointment-item" key={item.id}>
                <h3>Consultation {item.id}</h3>
                <p>Doctor: {getDoctorName(item.doctor_id)}</p>
                <p>Appointment ID: {item.appointment_id}</p>
                <p>Symptoms: {item.symptoms || "Not available"}</p>
                <p>Diagnosis: {item.diagnosis || "Not available"}</p>
                <p>Notes: {item.notes || "Not available"}</p>
                <p>
                  Date:{" "}
                  {item.consultation_date?.split("T")[0] || "Not available"}
                </p>
              </div>
            ))}
          </section>
        )}

        {showPrescriptions && (
          <section className="dashboard-card">
            <PanelHeader
              title="💊 My Prescriptions"
              onClose={() => setShowPrescriptions(false)}
            />
            {prescriptionLoading && <p>Loading prescriptions...</p>}
            {prescriptionError && (
              <p className="error-message">{prescriptionError}</p>
            )}
            {!prescriptionLoading &&
              !prescriptionError &&
              prescriptions.length === 0 && (
                <p>No prescription records available.</p>
              )}
            {prescriptions.map((item) => (
              <div className="appointment-item" key={item.id}>
                <h3>Prescription {item.id}</h3>
                <p>Doctor: {getDoctorName(item.doctor_id)}</p>
                <p>Consultation ID: {item.consultation_id}</p>
                <p>Medicine: {item.medicine_name || "Not available"}</p>
                <p>Dosage: {item.dosage || "Not available"}</p>
                <p>Frequency: {item.frequency || "Not available"}</p>
                <p>Duration: {item.duration || "Not available"}</p>
                <p>Instructions: {item.instructions || "Not available"}</p>
                <p>
                  Prescribed Date:{" "}
                  {item.prescribed_at?.split("T")[0] || "Not available"}
                </p>
              </div>
            ))}
          </section>
        )}

        {showVitals && (
          <section className="dashboard-card">
            <PanelHeader
              title="❤️ My Vitals"
              onClose={() => setShowVitals(false)}
            />
            {vitalsLoading && <p>Loading vitals...</p>}
            {vitalsError && <p className="error-message">{vitalsError}</p>}
            {!vitalsLoading && !vitalsError && vitals.length === 0 && (
              <p>No vitals available.</p>
            )}
            {vitals.map((item, index) => (
              <div className="appointment-item" key={item.id}>
                <h3>
                  {index === 0 ? "Latest Vitals" : `Vital Record ${item.id}`}
                </h3>
                <p>Temperature: {item.temperature ?? "Not available"} °F</p>
                <p>Blood Pressure: {item.blood_pressure || "Not available"}</p>
                <p>Heart Rate: {item.heart_rate ?? "Not available"} bpm</p>
                <p>Oxygen Level: {item.oxygen_level ?? "Not available"}%</p>
                <p>
                  Recorded Date:{" "}
                  {item.recorded_at?.split("T")[0] || "Not available"}
                </p>
              </div>
            ))}
          </section>
        )}

        {showLabReports && (
          <section className="dashboard-card">
            <PanelHeader
              title="🧪 My Lab Reports"
              onClose={() => setShowLabReports(false)}
            />
            {labLoading && <p>Loading lab reports...</p>}
            {labError && <p className="error-message">{labError}</p>}
            {!labLoading && !labError && labReports.length === 0 && (
              <p>No lab reports available.</p>
            )}
            {labReports.map((item) => (
              <div className="appointment-item" key={item.id}>
                <h3>Lab Report {item.id}</h3>
                <p>Test: {getLabTestName(item.lab_test_id)}</p>
                <p>Result: {item.result || "Not available"}</p>
                <p>Result Value: {item.result_value || "Not available"}</p>
                <p>Normal Range: {item.normal_range || "Not available"}</p>
                <p>
                  Report Date:{" "}
                  {item.report_date?.split("T")[0] || "Not available"}
                </p>
                <span className="appointment-status">
                  {item.report_status || "Not available"}
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function PanelHeader({ title, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      <h2>{title}</h2>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

const cellStyle = {
  padding: 12,
  border: "1px solid #ddd",
  verticalAlign: "top",
};

export default PatientDashboard;
