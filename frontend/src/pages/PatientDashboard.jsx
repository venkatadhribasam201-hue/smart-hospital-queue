import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

import {
  getQueue,
  getAppointments,
  getDoctors,
  getDepartments,
} from "../services/api";

import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // USER ID AND PATIENT ID
  // ==========================================

  const userId = Number(localStorage.getItem("userId"));
  const patientId = Number(localStorage.getItem("patientId"));

  // ==========================================
  // USER NAME
  // ==========================================

  const storedUserName = localStorage.getItem("userName");

  const [userName, setUserName] = useState(storedUserName || "Patient");

  // ==========================================
  // DASHBOARD STATES
  // ==========================================

  const [queue, setQueue] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LAB REPORT STATES
  // ==========================================

  const [labReports, setLabReports] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [showLabReports, setShowLabReports] = useState(false);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState("");

  // ==========================================
  // VITALS STATES
  // ==========================================

  const [vitals, setVitals] = useState([]);
  const [showVitals, setShowVitals] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState("");

  // ==========================================
  // CONSULTATION STATES
  // ==========================================

  const [consultations, setConsultations] = useState([]);
  const [showConsultations, setShowConsultations] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationError, setConsultationError] = useState("");

  // ==========================================
  // PRESCRIPTION STATES
  // ==========================================

  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  // ==========================================
  // NOTIFICATION STATES
  // ==========================================

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  // ==========================================
  // MEDICAL HISTORY STATES
  // ==========================================

  const [medicalHistory, setMedicalHistory] = useState([]);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false);
  const [medicalHistoryError, setMedicalHistoryError] = useState("");

  // ==========================================
  // APPOINTMENT FORM STATES
  // ==========================================

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("");

  // ==========================================
  // LOAD USER NAME
  // ==========================================

  const loadUserName = () => {
    const name = localStorage.getItem("userName");

    if (name && name.trim()) {
      setUserName(name.trim());
    } else {
      setUserName("Patient");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("patientId");
    localStorage.removeItem("doctorId");
    localStorage.removeItem("userName");

    navigate("/login");
  };

  // ==========================================
  // LOAD LAB REPORTS
  // ==========================================

  const loadLabReports = async () => {
    try {
      setLabLoading(true);
      setLabError("");

      const [reportsResponse, testsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/lab-reports/`),
        fetch(`${API_BASE_URL}/lab-tests/`),
      ]);

      const reportsData = await reportsResponse.json();
      const testsData = await testsResponse.json();

      if (!reportsResponse.ok) {
        throw new Error("Failed to load lab reports");
      }

      if (!testsResponse.ok) {
        throw new Error("Failed to load lab tests");
      }

      const patientReports = Array.isArray(reportsData)
        ? reportsData.filter(
            (report) => Number(report.patient_id) === Number(patientId),
          )
        : [];

      setLabReports(patientReports);
      setLabTests(Array.isArray(testsData) ? testsData : []);
    } catch (err) {
      console.error("Lab report error:", err);

      setLabError(err.message || "Failed to load lab reports");
    } finally {
      setLabLoading(false);
    }
  };

  // ==========================================
  // GET LAB TEST NAME
  // ==========================================

  const getLabTestName = (labTestId) => {
    const test = labTests.find((item) => Number(item.id) === Number(labTestId));

    return test ? test.test_name : `Lab Test ${labTestId}`;
  };

  // ==========================================
  // LOAD VITALS
  // ==========================================

  const loadVitals = async () => {
    try {
      setVitalsLoading(true);
      setVitalsError("");

      const response = await fetch(
        `${API_BASE_URL}/vitals/patient/${patientId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load vitals",
        );
      }

      setVitals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Vitals error:", err);

      setVitalsError(err.message || "Failed to load vitals");
    } finally {
      setVitalsLoading(false);
    }
  };

  // ==========================================
  // OPEN VITALS
  // ==========================================

  const handleVitals = async () => {
    setShowVitals(true);
    await loadVitals();
  };

  // ==========================================
  // LOAD CONSULTATIONS
  // ==========================================

  const loadConsultations = async () => {
    try {
      setConsultationLoading(true);
      setConsultationError("");

      const response = await fetch(`${API_BASE_URL}/consultations/`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load consultations",
        );
      }

      const patientConsultations = Array.isArray(data)
        ? data.filter(
            (consultation) =>
              Number(consultation.patient_id) === Number(patientId),
          )
        : [];

      setConsultations(patientConsultations);
    } catch (err) {
      console.error("Consultation error:", err);

      setConsultationError(err.message || "Failed to load consultations");
    } finally {
      setConsultationLoading(false);
    }
  };

  // ==========================================
  // OPEN CONSULTATIONS
  // ==========================================

  const handleConsultations = async () => {
    setShowConsultations(true);
    await loadConsultations();
  };

  // ==========================================
  // LOAD PRESCRIPTIONS
  // ==========================================

  const loadPrescriptions = async () => {
    try {
      setPrescriptionLoading(true);
      setPrescriptionError("");

      const response = await fetch(`${API_BASE_URL}/prescriptions/`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load prescriptions",
        );
      }

      const patientPrescriptions = Array.isArray(data)
        ? data.filter(
            (prescription) =>
              Number(prescription.patient_id) === Number(patientId),
          )
        : [];

      setPrescriptions(patientPrescriptions);
    } catch (err) {
      console.error("Prescription error:", err);

      setPrescriptionError(err.message || "Failed to load prescriptions");
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // ==========================================
  // OPEN PRESCRIPTIONS
  // ==========================================

  const handlePrescriptions = async () => {
    setShowPrescriptions(true);
    await loadPrescriptions();
  };

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      if (!userId || Number.isNaN(userId)) {
        throw new Error("User ID not found. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Notification API endpoint not found. Please check backend notifications route.",
          );
        }

        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load notifications",
        );
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notification error:", err);

      setNotificationError(err.message || "Failed to load notifications");
    } finally {
      setNotificationLoading(false);
    }
  };

  // ==========================================
  // OPEN NOTIFICATIONS
  // ==========================================

  const handleNotifications = async () => {
    setShowNotifications(true);
    await loadNotifications();
  };

  // ==========================================
  // MARK NOTIFICATION AS READ
  // ==========================================

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to mark notification as read",
        );
      }

      await loadNotifications();
    } catch (err) {
      console.error("Mark notification error:", err);

      setNotificationError(
        err.message || "Failed to mark notification as read",
      );
    }
  };

  // ==========================================
  // GET HISTORY DATE
  // ==========================================

  const getHistoryDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return String(dateValue).split("T")[0];
  };

  // ==========================================
  // LOAD MEDICAL HISTORY
  // ==========================================

  const loadMedicalHistory = async () => {
    try {
      setMedicalHistoryLoading(true);
      setMedicalHistoryError("");

      const [
        consultationResponse,
        prescriptionResponse,
        vitalsResponse,
        labReportsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/consultations/`),
        fetch(`${API_BASE_URL}/prescriptions/`),
        fetch(`${API_BASE_URL}/vitals/patient/${patientId}`),
        fetch(`${API_BASE_URL}/lab-reports/`),
      ]);

      const [consultationData, prescriptionData, vitalsData, labReportsData] =
        await Promise.all([
          consultationResponse.json(),
          prescriptionResponse.json(),
          vitalsResponse.json(),
          labReportsResponse.json(),
        ]);

      if (!consultationResponse.ok) {
        throw new Error("Failed to load consultation history");
      }

      if (!prescriptionResponse.ok) {
        throw new Error("Failed to load prescription history");
      }

      if (!vitalsResponse.ok) {
        throw new Error("Failed to load vitals history");
      }

      if (!labReportsResponse.ok) {
        throw new Error("Failed to load lab report history");
      }

      const patientConsultations = Array.isArray(consultationData)
        ? consultationData.filter(
            (item) => Number(item.patient_id) === Number(patientId),
          )
        : [];

      const patientPrescriptions = Array.isArray(prescriptionData)
        ? prescriptionData.filter(
            (item) => Number(item.patient_id) === Number(patientId),
          )
        : [];

      const patientVitals = Array.isArray(vitalsData) ? vitalsData : [];

      const patientLabReports = Array.isArray(labReportsData)
        ? labReportsData.filter(
            (item) => Number(item.patient_id) === Number(patientId),
          )
        : [];

      const historyMap = {};

      // ==========================================
      // CONSULTATIONS
      // ==========================================

      patientConsultations.forEach((consultation) => {
        const date = getHistoryDate(consultation.consultation_date);

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

        if (
          consultation.doctor_id &&
          !historyMap[date].doctorIds.includes(Number(consultation.doctor_id))
        ) {
          historyMap[date].doctorIds.push(Number(consultation.doctor_id));
        }

        historyMap[date].consultations.push(consultation);
      });

      // ==========================================
      // PRESCRIPTIONS
      // ==========================================

      patientPrescriptions.forEach((prescription) => {
        const date = getHistoryDate(prescription.prescribed_at);

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

        if (
          prescription.doctor_id &&
          !historyMap[date].doctorIds.includes(Number(prescription.doctor_id))
        ) {
          historyMap[date].doctorIds.push(Number(prescription.doctor_id));
        }

        historyMap[date].prescriptions.push(prescription);
      });

      // ==========================================
      // VITALS
      // ==========================================

      patientVitals.forEach((vital) => {
        const date = getHistoryDate(vital.recorded_at);

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

        historyMap[date].vitals.push(vital);
      });

      // ==========================================
      // LAB REPORTS
      // ==========================================

      patientLabReports.forEach((report) => {
        const date = getHistoryDate(report.report_date);

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

        historyMap[date].labReports.push(report);
      });

      const historyArray = Object.values(historyMap).sort((a, b) => {
        if (a.date === "Not available" && b.date === "Not available") {
          return 0;
        }

        if (a.date === "Not available") {
          return 1;
        }

        if (b.date === "Not available") {
          return -1;
        }

        return new Date(b.date) - new Date(a.date);
      });

      setMedicalHistory(historyArray);
    } catch (err) {
      console.error("Medical history error:", err);

      setMedicalHistoryError(err.message || "Failed to load medical history");
    } finally {
      setMedicalHistoryLoading(false);
    }
  };

  // ==========================================
  // OPEN MEDICAL HISTORY
  // ==========================================

  const handleMedicalHistory = async () => {
    setShowMedicalHistory(true);
    await loadMedicalHistory();
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        queueResponse,
        appointmentResponse,
        departmentResponse,
        doctorResponse,
      ] = await Promise.all([
        getQueue(),
        getAppointments(),
        getDepartments(),
        getDoctors(),
      ]);

      // ==========================================
      // QUEUE DATA
      // ==========================================

      const queueData = Array.isArray(queueResponse) ? queueResponse : [];

      const patientQueue = queueData.filter(
        (item) => Number(item.patient_id) === Number(patientId),
      );

      const activeQueues = patientQueue.filter(
        (item) => item.status === "waiting" || item.status === "serving",
      );

      if (activeQueues.length > 0) {
        setQueue(activeQueues[activeQueues.length - 1]);
      } else if (patientQueue.length > 0) {
        setQueue(patientQueue[patientQueue.length - 1]);
      } else {
        setQueue(null);
      }

      // ==========================================
      // APPOINTMENT DATA
      // ==========================================

      const appointmentData = Array.isArray(appointmentResponse)
        ? appointmentResponse
        : [];

      const patientAppointments = appointmentData.filter(
        (item) => Number(item.patient_id) === Number(patientId),
      );

      setAppointments(patientAppointments);

      // ==========================================
      // DEPARTMENT DATA
      // ==========================================

      const departmentData = Array.isArray(departmentResponse)
        ? departmentResponse
        : [];

      setDepartments(departmentData);

      // ==========================================
      // DOCTOR DATA
      // ==========================================

      const doctorData = Array.isArray(doctorResponse) ? doctorResponse : [];

      setDoctors(doctorData);

      console.log("User ID:", userId);

      console.log("Patient ID:", patientId);

      console.log("User Name:", userName);

      console.log("Queue:", patientQueue);

      console.log("Active Queue:", activeQueues);

      console.log("Appointments:", patientAppointments);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    if (
      !userId ||
      !patientId ||
      Number.isNaN(userId) ||
      Number.isNaN(patientId)
    ) {
      navigate("/login");
      return;
    }

    loadUserName();
    loadDashboard();
    loadNotifications();
  }, []);

  // ==========================================
  // FILTER DOCTORS
  // ==========================================

  const filteredDoctors = doctors.filter((doctor) => {
    if (!selectedDepartment) {
      return false;
    }

    return Number(doctor.department_id) === Number(selectedDepartment);
  });

  // ==========================================
  // GET DEPARTMENT NAME
  // ==========================================

  const getDepartmentName = (departmentId) => {
    const department = departments.find(
      (item) => Number(item.id) === Number(departmentId),
    );

    return department ? department.name : `Department ${departmentId}`;
  };

  // ==========================================
  // GET DOCTOR NAME
  // ==========================================

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((item) => Number(item.id) === Number(doctorId));

    if (!doctor) {
      return `Doctor ${doctorId}`;
    }

    return (
      doctor.name ||
      doctor.full_name ||
      doctor.doctor_name ||
      `Doctor ${doctorId}`
    );
  };

  // ==========================================
  // GET HISTORY DOCTORS
  // ==========================================

  const getHistoryDoctors = (doctorIds) => {
    if (!Array.isArray(doctorIds) || doctorIds.length === 0) {
      return "Not available";
    }

    return doctorIds.map((doctorId) => getDoctorName(doctorId)).join(", ");
  };

  // ==========================================
  // OPEN LAB REPORTS
  // ==========================================

  const handleLabReports = async () => {
    setShowLabReports(true);
    await loadLabReports();
  };

  // ==========================================
  // BOOK APPOINTMENT
  // ==========================================

  const handleBookAppointment = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedDepartment) {
      setError("Please select a department");
      return;
    }

    if (!selectedDoctor) {
      setError("Please select a doctor");
      return;
    }

    if (!appointmentDate) {
      setError("Please select appointment date");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter appointment reason");
      return;
    }

    try {
      setBooking(true);

      // ==========================================
      // CREATE APPOINTMENT
      // ==========================================

      const response = await fetch(`${API_BASE_URL}/appointments/`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          patient_id: Number(patientId),

          doctor_id: Number(selectedDoctor),

          department_id: Number(selectedDepartment),

          appointment_date: appointmentDate,

          reason: reason.trim(),

          status: "scheduled",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Appointment booking failed";

        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((item) => item.msg).join(", ");
        }

        throw new Error(errorMessage);
      }

      // ==========================================
      // APPOINTMENT ID
      // ==========================================

      const appointmentId = Number(data.appointment_id ?? data.id);

      if (!Number.isInteger(appointmentId)) {
        throw new Error(
          "Appointment ID was not returned correctly by the backend.",
        );
      }

      // ==========================================
      // CREATE QUEUE TOKEN
      // ==========================================

      const queuePayload = {
        appointment_id: appointmentId,

        patient_id: Number(patientId),

        doctor_id: Number(selectedDoctor),

        queue_date: appointmentDate,

        estimated_waiting_time: 0,
      };

      const queueResponse = await fetch(`${API_BASE_URL}/queue/`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(queuePayload),
      });

      const queueData = await queueResponse.json();

      if (!queueResponse.ok) {
        let queueError =
          "Appointment created but queue token generation failed.";

        if (typeof queueData.detail === "string") {
          queueError = queueData.detail;
        } else if (Array.isArray(queueData.detail)) {
          queueError = queueData.detail
            .map((item) => item.msg || "Queue validation error")
            .join(", ");
        }

        throw new Error(queueError);
      }

      // ==========================================
      // QUEUE NOTIFICATION
      // ==========================================

      try {
        const notificationResponse = await fetch(
          `${API_BASE_URL}/notifications/`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              user_id: Number(userId),

              title: "Queue Token Generated",

              message: `Your queue token is ${queueData.token_number}. Your estimated waiting time is ${queueData.estimated_waiting_time ?? 0} minutes.`,

              notification_type: "queue",

              is_read: false,
            }),
          },
        );

        const notificationData = await notificationResponse.json();

        if (!notificationResponse.ok) {
          console.error("Queue notification failed:", notificationData);
        }
      } catch (notificationError) {
        console.error("Queue notification error:", notificationError);
      }

      await loadNotifications();

      // ==========================================
      // SUCCESS MESSAGE
      // ==========================================

      setMessage(
        `Appointment booked successfully. Queue Token ${queueData.token_number} | Estimated Waiting Time: ${queueData.estimated_waiting_time ?? 0} min`,
      );

      // ==========================================
      // CLEAR FORM
      // ==========================================

      setSelectedDepartment("");
      setSelectedDoctor("");
      setAppointmentDate("");
      setReason("");

      // ==========================================
      // RELOAD DASHBOARD
      // ==========================================

      await loadDashboard();
    } catch (err) {
      console.error("Booking error:", err);

      setError(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  // ==========================================
  // UNREAD NOTIFICATION COUNT
  // ==========================================

  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <h2>Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1>🏥 Smart Hospital</h1>

            <p className="welcome">Welcome, {userName} 👋</p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={handleNotifications}
              style={{
                position: "relative",
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#2563eb",
                color: "white",
                fontSize: "16px",
              }}
            >
              🔔 Notifications
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "22px",
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#dc2626",
                color: "white",
                fontSize: "16px",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* BOOK APPOINTMENT */}

        <div className="dashboard-card">
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
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <label>Select Doctor</label>

            <select
              value={selectedDoctor}
              onChange={(event) => setSelectedDoctor(event.target.value)}
              disabled={!selectedDepartment}
            >
              <option value="">Select Doctor</option>

              {filteredDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name ||
                    doctor.full_name ||
                    doctor.doctor_name ||
                    `Doctor ${doctor.id}`}
                </option>
              ))}
            </select>

            {selectedDepartment && filteredDoctors.length > 0 && (
              <p
                style={{
                  color: "#16a34a",
                  marginTop: "5px",
                  fontWeight: "600",
                }}
              >
                {filteredDoctors.length} doctor(s) available
              </p>
            )}

            {selectedDepartment && filteredDoctors.length === 0 && (
              <p
                style={{
                  color: "red",
                  marginTop: "5px",
                }}
              >
                No doctors available for this department.
              </p>
            )}

            <label>Appointment Date</label>

            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => setAppointmentDate(event.target.value)}
            />

            <label>Reason for Visit</label>

            <textarea
              placeholder="Enter your symptoms or reason for visit"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows="4"
            />

            {error && <div className="error-message">❌ {error}</div>}

            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="book-button" disabled={booking}>
              {booking ? "Booking..." : "📅 Book Appointment"}
            </button>
          </form>
        </div>

        {/* MY QUEUE */}

        <div className="dashboard-card">
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
                    {queue.queue_date
                      ? queue.queue_date.split("T")[0]
                      : "Not available"}
                  </strong>
                </div>

                <div>
                  <span>Patients Ahead</span>

                  <strong>{queue.patients_ahead ?? 0}</strong>
                </div>

                <div>
                  <span>AI Estimated Wait</span>

                  <strong>{queue.estimated_waiting_time ?? 0} minutes</strong>
                </div>
              </div>

              <div
                className="dashboard-status"
                style={{
                  marginTop: "20px",
                  textAlign: "center",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {queue.status || "waiting"}
              </div>

              {queue.status === "waiting" && (
                <p
                  style={{
                    marginTop: "15px",
                    textAlign: "center",
                  }}
                >
                  ⏳ Please wait for your turn.
                </p>
              )}

              {queue.status === "serving" && (
                <p
                  style={{
                    marginTop: "15px",
                    textAlign: "center",
                    color: "#16a34a",
                    fontWeight: "bold",
                  }}
                >
                  🟢 It is your turn. Please proceed to the doctor.
                </p>
              )}

              {queue.status === "completed" && (
                <p
                  style={{
                    marginTop: "15px",
                    textAlign: "center",
                  }}
                >
                  ✅ Your consultation has been completed.
                </p>
              )}

              {queue.status === "cancelled" && (
                <p
                  style={{
                    marginTop: "15px",
                    textAlign: "center",
                    color: "red",
                  }}
                >
                  ❌ Your queue token has been cancelled.
                </p>
              )}
            </>
          ) : (
            <p>No active queue found.</p>
          )}
        </div>

        {/* MY APPOINTMENTS */}

        <div className="dashboard-card">
          <h2>📋 My Appointments</h2>

          {appointments.length === 0 ? (
            <p>No appointments found.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div className="appointment-item" key={appointment.id}>
                  <h3>Appointment {appointment.id}</h3>

                  <p>
                    <strong>Department:</strong>{" "}
                    {getDepartmentName(appointment.department_id)}
                  </p>

                  <p>
                    <strong>Doctor:</strong>{" "}
                    {getDoctorName(appointment.doctor_id)}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {appointment.appointment_date
                      ? appointment.appointment_date.split("T")[0]
                      : "Not available"}
                  </p>

                  <p>
                    <strong>Reason:</strong> {appointment.reason}
                  </p>

                  <span className="appointment-status">
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}

        {showNotifications && (
          <div className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>🔔 My Notifications</h2>

              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#6b7280",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>

            {notificationLoading && <p>Loading notifications...</p>}

            {notificationError && (
              <div className="error-message">❌ {notificationError}</div>
            )}

            {!notificationLoading &&
              !notificationError &&
              notifications.length === 0 && <p>No notifications available.</p>}

            {!notificationLoading &&
              !notificationError &&
              notifications.length > 0 && (
                <div className="appointments-list">
                  {notifications.map((notification) => (
                    <div
                      className="appointment-item"
                      key={notification.id}
                      style={{
                        borderLeft: notification.is_read
                          ? "4px solid #9ca3af"
                          : "4px solid #2563eb",
                      }}
                    >
                      <h3>
                        {notification.is_read ? "📩" : "🔵"}{" "}
                        {notification.title}
                      </h3>

                      <p>
                        <strong>Message:</strong> {notification.message}
                      </p>

                      <p>
                        <strong>Type:</strong>{" "}
                        {notification.notification_type || "General"}
                      </p>

                      <p>
                        <strong>Date:</strong>{" "}
                        {notification.created_at
                          ? notification.created_at.split("T")[0]
                          : "Not available"}
                      </p>

                      <span className="appointment-status">
                        {notification.is_read ? "READ" : "UNREAD"}
                      </span>

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                          style={{
                            marginTop: "10px",
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            background: "#16a34a",
                            color: "white",
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* MEDICAL INFORMATION */}

        <div className="dashboard-card">
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
        </div>

        {/* MEDICAL HISTORY */}

        {showMedicalHistory && (
          <div className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>📋 My Medical History</h2>

              <button
                type="button"
                onClick={() => setShowMedicalHistory(false)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#6b7280",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>

            {medicalHistoryLoading && <p>Loading medical history...</p>}

            {medicalHistoryError && (
              <div className="error-message">❌ {medicalHistoryError}</div>
            )}

            {!medicalHistoryLoading &&
              !medicalHistoryError &&
              medicalHistory.length === 0 && (
                <p>No medical history available.</p>
              )}

            {!medicalHistoryLoading &&
              !medicalHistoryError &&
              medicalHistory.length > 0 && (
                <div
                  style={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "10px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          Date
                        </th>

                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          Doctor
                        </th>

                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          Consultation
                        </th>

                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          Prescription
                        </th>

                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          Vitals
                        </th>

                        <th
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                          }}
                        >
                          Lab Report
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {medicalHistory.map((history, index) => (
                        <tr key={`${history.date}-${index}`}>
                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            <strong>{history.date}</strong>
                          </td>

                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            {getHistoryDoctors(history.doctorIds)}
                          </td>

                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            {history.consultations.length > 0 ? (
                              history.consultations.map((consultation) => (
                                <div
                                  key={consultation.id}
                                  style={{
                                    marginBottom: "8px",
                                  }}
                                >
                                  <strong>Completed</strong>
                                  <br />
                                  Diagnosis:{" "}
                                  {consultation.diagnosis || "Not available"}
                                  <br />
                                  Symptoms:{" "}
                                  {consultation.symptoms || "Not available"}
                                </div>
                              ))
                            ) : (
                              <span>Not available</span>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            {history.prescriptions.length > 0 ? (
                              history.prescriptions.map((prescription) => (
                                <div
                                  key={prescription.id}
                                  style={{
                                    marginBottom: "8px",
                                  }}
                                >
                                  <strong>{prescription.medicine_name}</strong>
                                  <br />
                                  Dosage:{" "}
                                  {prescription.dosage || "Not available"}
                                  <br />
                                  Frequency:{" "}
                                  {prescription.frequency || "Not available"}
                                  <br />
                                  Duration:{" "}
                                  {prescription.duration || "Not available"}
                                </div>
                              ))
                            ) : (
                              <span>Not available</span>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            {history.vitals.length > 0 ? (
                              history.vitals.map((vital) => (
                                <div
                                  key={vital.id}
                                  style={{
                                    marginBottom: "8px",
                                  }}
                                >
                                  Temperature: {vital.temperature ?? "N/A"} °F
                                  <br />
                                  Blood Pressure:{" "}
                                  {vital.blood_pressure || "N/A"}
                                  <br />
                                  Heart Rate: {vital.heart_rate ?? "N/A"} bpm
                                  <br />
                                  Oxygen: {vital.oxygen_level ?? "N/A"}%
                                </div>
                              ))
                            ) : (
                              <span>Not available</span>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "12px",
                              border: "1px solid #ddd",
                              verticalAlign: "top",
                            }}
                          >
                            {history.labReports.length > 0 ? (
                              history.labReports.map((report) => (
                                <div
                                  key={report.id}
                                  style={{
                                    marginBottom: "8px",
                                  }}
                                >
                                  <strong>
                                    {getLabTestName(report.lab_test_id)}
                                  </strong>
                                  <br />
                                  Result: {report.result || "Not available"}
                                  <br />
                                  Value:{" "}
                                  {report.result_value || "Not available"}
                                  <br />
                                  Status:{" "}
                                  {report.report_status || "Not available"}
                                </div>
                              ))
                            ) : (
                              <span>Not available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* CONSULTATIONS */}

        {showConsultations && (
          <div className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>🩺 My Consultations</h2>

              <button
                type="button"
                onClick={() => setShowConsultations(false)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#6b7280",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>

            {consultationLoading && <p>Loading consultations...</p>}

            {consultationError && (
              <div className="error-message">❌ {consultationError}</div>
            )}

            {!consultationLoading &&
              !consultationError &&
              consultations.length === 0 && (
                <p>No consultation records available.</p>
              )}

            {!consultationLoading &&
              !consultationError &&
              consultations.length > 0 && (
                <div className="appointments-list">
                  {consultations.map((consultation) => (
                    <div className="appointment-item" key={consultation.id}>
                      <h3>Consultation {consultation.id}</h3>

                      <p>
                        <strong>Doctor:</strong>{" "}
                        {getDoctorName(consultation.doctor_id)}
                      </p>

                      <p>
                        <strong>Appointment ID:</strong>{" "}
                        {consultation.appointment_id}
                      </p>

                      <p>
                        <strong>Symptoms:</strong>{" "}
                        {consultation.symptoms || "Not available"}
                      </p>

                      <p>
                        <strong>Diagnosis:</strong>{" "}
                        {consultation.diagnosis || "Not available"}
                      </p>

                      <p>
                        <strong>Notes:</strong>{" "}
                        {consultation.notes || "Not available"}
                      </p>

                      <p>
                        <strong>Consultation Date:</strong>{" "}
                        {consultation.consultation_date
                          ? consultation.consultation_date.split("T")[0]
                          : "Not available"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* PRESCRIPTIONS */}

        {showPrescriptions && (
          <div className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>💊 My Prescriptions</h2>

              <button
                type="button"
                onClick={() => setShowPrescriptions(false)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#6b7280",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>

            {prescriptionLoading && <p>Loading prescriptions...</p>}

            {prescriptionError && (
              <div className="error-message">❌ {prescriptionError}</div>
            )}

            {!prescriptionLoading &&
              !prescriptionError &&
              prescriptions.length === 0 && (
                <p>No prescription records available.</p>
              )}

            {!prescriptionLoading &&
              !prescriptionError &&
              prescriptions.length > 0 && (
                <div className="appointments-list">
                  {prescriptions.map((prescription) => (
                    <div className="appointment-item" key={prescription.id}>
                      <h3>Prescription {prescription.id}</h3>

                      <p>
                        <strong>Doctor:</strong>{" "}
                        {getDoctorName(prescription.doctor_id)}
                      </p>

                      <p>
                        <strong>Consultation ID:</strong>{" "}
                        {prescription.consultation_id}
                      </p>

                      <p>
                        <strong>Medicine:</strong>{" "}
                        {prescription.medicine_name || "Not available"}
                      </p>

                      <p>
                        <strong>Dosage:</strong>{" "}
                        {prescription.dosage || "Not available"}
                      </p>

                      <p>
                        <strong>Frequency:</strong>{" "}
                        {prescription.frequency || "Not available"}
                      </p>

                      <p>
                        <strong>Duration:</strong>{" "}
                        {prescription.duration || "Not available"}
                      </p>

                      <p>
                        <strong>Instructions:</strong>{" "}
                        {prescription.instructions || "Not available"}
                      </p>

                      <p>
                        <strong>Prescribed Date:</strong>{" "}
                        {prescription.prescribed_at
                          ? prescription.prescribed_at.split("T")[0]
                          : "Not available"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* VITALS */}

        {showVitals && (
          <div className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>❤️ My Vitals</h2>

              <button
                type="button"
                onClick={() => setShowVitals(false)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#6b7280",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>

            {vitalsLoading && <p>Loading vitals...</p>}

            {vitalsError && (
              <div className="error-message">❌ {vitalsError}</div>
            )}

            {!vitalsLoading && !vitalsError && vitals.length === 0 && (
              <p>No vitals available.</p>
            )}

            {!vitalsLoading && !vitalsError && vitals.length > 0 && (
              <div className="appointments-list">
                {vitals.map((vital, index) => (
                  <div className="appointment-item" key={vital.id}>
                    <h3>
                      {index === 0
                        ? "Latest Vitals"
                        : `Vital Record ${vital.id}`}
                    </h3>

                    <p>
                      <strong>Temperature:</strong>{" "}
                      {vital.temperature ?? "Not available"} °F
                    </p>

                    <p>
                      <strong>Blood Pressure:</strong>{" "}
                      {vital.blood_pressure || "Not available"}
                    </p>

                    <p>
                      <strong>Heart Rate:</strong>{" "}
                      {vital.heart_rate ?? "Not available"} bpm
                    </p>

                    <p>
                      <strong>Oxygen Level:</strong>{" "}
                      {vital.oxygen_level ?? "Not available"}%
                    </p>

                    <p>
                      <strong>Recorded Date:</strong>{" "}
                      {vital.recorded_at
                        ? vital.recorded_at.split("T")[0]
                        : "Not available"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LAB REPORTS */}

        {showLabReports && (
          <div className="dashboard-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>🧪 My Lab Reports</h2>

              <button
                type="button"
                onClick={() => setShowLabReports(false)}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#6b7280",
                  color: "white",
                }}
              >
                Close
              </button>
            </div>

            {labLoading && <p>Loading lab reports...</p>}

            {labError && <div className="error-message">❌ {labError}</div>}

            {!labLoading && !labError && labReports.length === 0 && (
              <p>No lab reports available.</p>
            )}

            {!labLoading && !labError && labReports.length > 0 && (
              <div className="appointments-list">
                {labReports.map((report) => (
                  <div className="appointment-item" key={report.id}>
                    <h3>Lab Report {report.id}</h3>

                    <p>
                      <strong>Test:</strong>{" "}
                      {getLabTestName(report.lab_test_id)}
                    </p>

                    <p>
                      <strong>Result:</strong>{" "}
                      {report.result || "Not available"}
                    </p>

                    <p>
                      <strong>Result Value:</strong>{" "}
                      {report.result_value || "Not available"}
                    </p>

                    <p>
                      <strong>Normal Range:</strong>{" "}
                      {report.normal_range || "Not available"}
                    </p>

                    <p>
                      <strong>Report Date:</strong>{" "}
                      {report.report_date
                        ? report.report_date.split("T")[0]
                        : "Not available"}
                    </p>

                    <span className="appointment-status">
                      {report.report_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
