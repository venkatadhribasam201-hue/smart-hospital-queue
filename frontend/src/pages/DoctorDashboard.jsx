import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorDashboard.css";

const API = "http://127.0.0.1:8000";

function DoctorDashboard() {
  const navigate = useNavigate();

  // =========================================================
  // AUTH
  // =========================================================

  const doctorId = Number(localStorage.getItem("doctorId"));
  const userRole = localStorage.getItem("userRole");

  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    if (userRole !== "doctor" || !doctorId) {
      localStorage.removeItem("doctorId");
      navigate("/login");
    }
  }, [doctorId, userRole, navigate]);

  // =========================================================
  // MAIN DATA
  // =========================================================

  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(true);

  const [error, setError] = useState("");
  const [queueError, setQueueError] = useState("");

  // =========================================================
  // PATIENT SELECTOR
  // =========================================================

  const [selectedPatientId, setSelectedPatientId] = useState("");

  // =========================================================
  // CONSULTATION
  // =========================================================

  const [showConsultation, setShowConsultation] = useState(false);
  const [showConsultationDetails, setShowConsultationDetails] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  const [consultationError, setConsultationError] = useState("");
  const [savingConsultation, setSavingConsultation] = useState(false);

  const [consultationDetails, setConsultationDetails] = useState([]);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationViewError, setConsultationViewError] = useState("");

  const [consultationPatientIds, setConsultationPatientIds] = useState([]);
  const [consultationMap, setConsultationMap] = useState({});

  // =========================================================
  // PRESCRIPTION
  // =========================================================

  const [showPrescription, setShowPrescription] = useState(false);
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);

  const [prescriptionMedicine, setPrescriptionMedicine] = useState("");
  const [prescriptionDosage, setPrescriptionDosage] = useState("");
  const [prescriptionFrequency, setPrescriptionFrequency] = useState("");
  const [prescriptionDuration, setPrescriptionDuration] = useState("");
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");

  const [prescriptionError, setPrescriptionError] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [prescriptionDetails, setPrescriptionDetails] = useState([]);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionViewError, setPrescriptionViewError] = useState("");

  const [prescriptionConsultationIds, setPrescriptionConsultationIds] =
    useState([]);

  // =========================================================
  // VITALS
  // =========================================================

  const [showVitals, setShowVitals] = useState(false);
  const [showVitalsForm, setShowVitalsForm] = useState(false);

  const [patientVitals, setPatientVitals] = useState([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState("");

  const [vitalTemperature, setVitalTemperature] = useState("");
  const [vitalBloodPressure, setVitalBloodPressure] = useState("");
  const [vitalHeartRate, setVitalHeartRate] = useState("");
  const [vitalOxygenLevel, setVitalOxygenLevel] = useState("");

  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalSaveError, setVitalSaveError] = useState("");

  const [vitalsDataByPatient, setVitalsDataByPatient] = useState({});

  // =========================================================
  // LAB
  // =========================================================

  const [showLabReports, setShowLabReports] = useState(false);
  const [showLabTestForm, setShowLabTestForm] = useState(false);
  const [showLabReportForm, setShowLabReportForm] = useState(false);

  const [labReports, setLabReports] = useState([]);
  const [labTests, setLabTests] = useState([]);

  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState("");

  const [labDataByPatient, setLabDataByPatient] = useState({});

  const [labTestName, setLabTestName] = useState("");
  const [labTestDescription, setLabTestDescription] = useState("");

  const [savingLabTest, setSavingLabTest] = useState(false);
  const [labTestError, setLabTestError] = useState("");

  const [selectedLabTestId, setSelectedLabTestId] = useState("");

  const [labResult, setLabResult] = useState("");
  const [labResultValue, setLabResultValue] = useState("");
  const [labNormalRange, setLabNormalRange] = useState("");
  const [labReportStatus, setLabReportStatus] = useState("completed");

  const [savingLabReport, setSavingLabReport] = useState(false);
  const [labReportSaveError, setLabReportSaveError] = useState("");

  // =========================================================
  // HELPERS
  // =========================================================

  const getArrayData = (data, keys = []) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  const formatDateTime = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace("T", " ");
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // UNIQUE PATIENTS
  // =========================================================

  const uniquePatients = useMemo(() => {
    const map = new Map();

    appointments.forEach((appointment) => {
      const patientId = Number(appointment.patient_id);

      if (!patientId) return;

      if (!map.has(patientId)) {
        map.set(patientId, {
          id: patientId,
          name: appointment.patient_name || `Patient ${patientId}`,
        });
      }
    });

    return Array.from(map.values());
  }, [appointments]);

  // =========================================================
  // DEFAULT PATIENT
  // =========================================================

  useEffect(() => {
    if (!uniquePatients.length) {
      setSelectedPatientId("");
      return;
    }

    const exists = uniquePatients.some(
      (patient) => Number(patient.id) === Number(selectedPatientId),
    );

    if (!exists) {
      setSelectedPatientId(String(uniquePatients[0].id));
    }
  }, [uniquePatients, selectedPatientId]);

  // =========================================================
  // SELECTED PATIENT APPOINTMENT
  // =========================================================

  const selectedPatient = useMemo(() => {
    return uniquePatients.find(
      (patient) => Number(patient.id) === Number(selectedPatientId),
    );
  }, [uniquePatients, selectedPatientId]);

  const selectedPatientAppointment = useMemo(() => {
    if (!selectedPatient) return null;

    return (
      appointments.find(
        (appointment) =>
          Number(appointment.patient_id) === Number(selectedPatient.id),
      ) || null
    );
  }, [appointments, selectedPatient]);

  // =========================================================
  // CLOSE ALL
  // =========================================================

  const closeAllSections = () => {
    setShowConsultation(false);
    setShowConsultationDetails(false);

    setShowPrescription(false);
    setShowPrescriptionDetails(false);

    setShowVitals(false);
    setShowVitalsForm(false);

    setShowLabReports(false);
    setShowLabTestForm(false);
    setShowLabReportForm(false);
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    [
      "userId",
      "userRole",
      "userEmail",
      "accessToken",
      "patientId",
      "doctorId",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login");
  };

  // =========================================================
  // LOAD APPOINTMENTS
  // =========================================================

  const loadAppointments = async () => {
    try {
      setError("");

      const response = await fetch(`${API}/appointments/doctor/${doctorId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load appointments",
        );
      }

      const list = getArrayData(data, ["appointments", "items", "data"]);

      setAppointments(list);

      return list;
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load appointments");
      return [];
    }
  };

  // =========================================================
  // LOAD QUEUE
  // =========================================================

  const loadQueue = async () => {
    try {
      setQueueLoading(true);
      setQueueError("");

      const response = await fetch(`${API}/queue/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load queue",
        );
      }

      const list = getArrayData(data, ["queue", "items", "data"]);

      setQueue(
        list.filter((item) => Number(item.doctor_id) === Number(doctorId)),
      );
    } catch (err) {
      console.error(err);
      setQueueError(err.message || "Failed to load queue");
    } finally {
      setQueueLoading(false);
    }
  };

  // =========================================================
  // LOAD VITAL STATUS
  // =========================================================

  const loadVitalsStatus = async (appointmentList) => {
    const patientIds = [
      ...new Set(
        appointmentList.map((item) => Number(item.patient_id)).filter(Boolean),
      ),
    ];

    const result = {};

    await Promise.all(
      patientIds.map(async (patientId) => {
        try {
          const response = await fetch(`${API}/vitals/patient/${patientId}`);

          if (!response.ok) {
            result[patientId] = [];
            return;
          }

          const data = await response.json();

          result[patientId] = getArrayData(data, ["vitals", "items", "data"]);
        } catch {
          result[patientId] = [];
        }
      }),
    );

    setVitalsDataByPatient(result);
  };

  // =========================================================
  // LOAD LAB STATUS
  // =========================================================

  const loadLabStatus = async (appointmentList) => {
    try {
      const [reportsResponse, testsResponse] = await Promise.all([
        fetch(`${API}/lab-reports/`),
        fetch(`${API}/lab-tests/`),
      ]);

      const reportsData = await reportsResponse.json();
      const testsData = await testsResponse.json();

      const reports = getArrayData(reportsData, [
        "reports",
        "lab_reports",
        "items",
        "data",
      ]);

      const tests = getArrayData(testsData, [
        "tests",
        "lab_tests",
        "items",
        "data",
      ]);

      const patientIds = [
        ...new Set(
          appointmentList
            .map((item) => Number(item.patient_id))
            .filter(Boolean),
        ),
      ];

      const result = {};

      patientIds.forEach((patientId) => {
        const patientTests = tests.filter(
          (test) =>
            Number(test.patient_id) === patientId &&
            Number(test.doctor_id) === Number(doctorId),
        );

        const testIds = new Set(patientTests.map((test) => Number(test.id)));

        const patientReports = reports.filter(
          (report) =>
            Number(report.patient_id) === patientId &&
            testIds.has(Number(report.lab_test_id)),
        );

        const reportedIds = new Set(
          patientReports.map((report) => Number(report.lab_test_id)),
        );

        result[patientId] = {
          tests: patientTests,
          reports: patientReports,
          pendingTests: patientTests.filter(
            (test) => !reportedIds.has(Number(test.id)),
          ),
        };
      });

      setLabDataByPatient(result);
    } catch (err) {
      console.error("Lab status error:", err);
    }
  };

  // =========================================================
  // LOAD CONSULTATIONS / PRESCRIPTIONS
  // =========================================================

  const loadMedicalStatus = async () => {
    try {
      const [consultationResponse, prescriptionResponse] = await Promise.all([
        fetch(`${API}/consultations/`),
        fetch(`${API}/prescriptions/`),
      ]);

      const consultationData = await consultationResponse.json();

      const prescriptionData = await prescriptionResponse.json();

      const allConsultations = getArrayData(consultationData, [
        "consultations",
        "items",
        "data",
      ]);

      const consultations = allConsultations.filter(
        (item) => Number(item.doctor_id) === Number(doctorId),
      );

      const patientIds = consultations.map((item) => Number(item.patient_id));

      const lookup = {};

      consultations.forEach((item) => {
        lookup[item.id] = {
          patientId: Number(item.patient_id),
          appointmentId: Number(item.appointment_id),
        };
      });

      setConsultationPatientIds([...new Set(patientIds)]);

      setConsultationMap(lookup);

      const allPrescriptions = getArrayData(prescriptionData, [
        "prescriptions",
        "items",
        "data",
      ]);

      const prescriptions = allPrescriptions.filter(
        (item) => Number(item.doctor_id) === Number(doctorId),
      );

      const prescriptionConsultationIds = prescriptions.map((item) =>
        Number(item.consultation_id),
      );

      setPrescriptionConsultationIds([...new Set(prescriptionConsultationIds)]);
    } catch (err) {
      console.error("Medical status error:", err);
    }
  };

  // =========================================================
  // DOCTOR NAME
  // =========================================================

  const loadDoctorName = async () => {
    try {
      const response = await fetch(`${API}/doctors/`);
      const data = await response.json();

      const doctors = getArrayData(data, ["doctors", "items", "data"]);

      const doctor = doctors.find(
        (item) => Number(item.id) === Number(doctorId),
      );

      const name = doctor?.full_name || doctor?.name || `Doctor ${doctorId}`;

      setDoctorName(String(name).replace(/^Dr\.\s*/i, ""));
    } catch (err) {
      console.error(err);
      setDoctorName(`Doctor ${doctorId}`);
    }
  };

  // =========================================================
  // DASHBOARD LOAD
  // =========================================================

  const loadDashboard = async () => {
    if (!doctorId) return;

    setLoading(true);

    try {
      const appointmentData = await loadAppointments();

      await Promise.all([
        loadDoctorName(),
        loadQueue(),
        loadMedicalStatus(),
        loadVitalsStatus(appointmentData),
        loadLabStatus(appointmentData),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "doctor" && doctorId) {
      loadDashboard();
    }
  }, []);

  // =========================================================
  // QUEUE STATUS
  // =========================================================

  const updateQueueStatus = async (queueId, status) => {
    try {
      const response = await fetch(`${API}/queue/${queueId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to update queue",
        );
      }

      await loadQueue();
    } catch (err) {
      setQueueError(err.message);
    }
  };

  // =========================================================
  // CONSULTATION - ADD
  // =========================================================

  const openConsultation = (appointment) => {
    const patientId = Number(appointment.patient_id);

    if (consultationPatientIds.includes(patientId)) {
      alert("Consultation already exists for this patient.");
      return;
    }

    closeAllSections();

    setSelectedAppointment(appointment);

    setSymptoms("");
    setDiagnosis("");
    setNotes("");
    setConsultationError("");

    setShowConsultation(true);
  };

  const saveConsultation = async () => {
    if (!selectedAppointment) return;

    const patientId = Number(selectedAppointment.patient_id);

    if (consultationPatientIds.includes(patientId)) {
      setConsultationError("Consultation already exists for this patient.");
      return;
    }

    if (!symptoms.trim()) {
      setConsultationError("Please enter symptoms.");
      return;
    }

    if (!diagnosis.trim()) {
      setConsultationError("Please enter diagnosis.");
      return;
    }

    if (!notes.trim()) {
      setConsultationError("Please enter notes.");
      return;
    }

    try {
      setSavingConsultation(true);
      setConsultationError("");

      const response = await fetch(`${API}/consultations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: Number(selectedAppointment.id),
          symptoms: symptoms.trim(),
          diagnosis: diagnosis.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to save consultation",
        );
      }

      alert("Consultation saved successfully!");

      closeConsultation();

      const appointmentData = await loadAppointments();

      await Promise.all([
        loadMedicalStatus(),
        loadVitalsStatus(appointmentData),
        loadLabStatus(appointmentData),
      ]);
    } catch (err) {
      setConsultationError(err.message);
    } finally {
      setSavingConsultation(false);
    }
  };

  const closeConsultation = () => {
    setShowConsultation(false);
    setSelectedAppointment(null);

    setSymptoms("");
    setDiagnosis("");
    setNotes("");
    setConsultationError("");
  };

  // =========================================================
  // CONSULTATION - VIEW
  // =========================================================

  const openConsultationDetails = async (appointment) => {
    try {
      closeAllSections();

      setSelectedAppointment(appointment);
      setShowConsultationDetails(true);
      setConsultationLoading(true);
      setConsultationViewError("");

      const response = await fetch(`${API}/consultations/`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load consultation");
      }

      const consultations = getArrayData(data, [
        "consultations",
        "items",
        "data",
      ]);

      const matching = consultations.filter(
        (item) =>
          Number(item.doctor_id) === Number(doctorId) &&
          Number(item.patient_id) === Number(appointment.patient_id) &&
          Number(item.appointment_id) === Number(appointment.id),
      );

      setConsultationDetails(matching);
    } catch (err) {
      setConsultationViewError(err.message);
    } finally {
      setConsultationLoading(false);
    }
  };

  const closeConsultationDetails = () => {
    setShowConsultationDetails(false);
    setSelectedAppointment(null);
    setConsultationDetails([]);
    setConsultationViewError("");
  };

  // =========================================================
  // PRESCRIPTION - OPEN
  // =========================================================

  const openPrescription = async (appointment) => {
    try {
      closeAllSections();

      const response = await fetch(`${API}/consultations/`);

      const data = await response.json();

      const consultations = getArrayData(data, [
        "consultations",
        "items",
        "data",
      ]);

      const matching = consultations.filter(
        (item) =>
          Number(item.doctor_id) === Number(doctorId) &&
          Number(item.patient_id) === Number(appointment.patient_id) &&
          Number(item.appointment_id) === Number(appointment.id),
      );

      if (!matching.length) {
        alert("Please save consultation first.");
        return;
      }

      const consultationId = Number(matching[matching.length - 1].id);

      if (prescriptionConsultationIds.includes(consultationId)) {
        alert("Prescription already exists for this consultation.");
        return;
      }

      setSelectedAppointment(appointment);

      setPrescriptionMedicine("");
      setPrescriptionDosage("");
      setPrescriptionFrequency("");
      setPrescriptionDuration("");
      setPrescriptionInstructions("");
      setPrescriptionError("");

      setShowPrescription(true);
    } catch (err) {
      setPrescriptionError(err.message);
    }
  };

  // =========================================================
  // PRESCRIPTION - SAVE
  // =========================================================

  const savePrescription = async () => {
    if (!selectedAppointment) return;

    if (!prescriptionMedicine.trim()) {
      setPrescriptionError("Please enter medicine name.");
      return;
    }

    if (!prescriptionDosage.trim()) {
      setPrescriptionError("Please enter dosage.");
      return;
    }

    if (!prescriptionFrequency.trim()) {
      setPrescriptionError("Please enter frequency.");
      return;
    }

    if (!prescriptionDuration.trim()) {
      setPrescriptionError("Please enter duration.");
      return;
    }

    try {
      setSavingPrescription(true);
      setPrescriptionError("");

      const consultationResponse = await fetch(`${API}/consultations/`);

      const consultationData = await consultationResponse.json();

      const consultations = getArrayData(consultationData, [
        "consultations",
        "items",
        "data",
      ]);

      const matching = consultations.filter(
        (item) =>
          Number(item.doctor_id) === Number(doctorId) &&
          Number(item.patient_id) === Number(selectedAppointment.patient_id) &&
          Number(item.appointment_id) === Number(selectedAppointment.id),
      );

      if (!matching.length) {
        throw new Error("Please save consultation first.");
      }

      const consultation = matching[matching.length - 1];

      const existingResponse = await fetch(`${API}/prescriptions/`);

      const existingData = await existingResponse.json();

      const existing = getArrayData(existingData, [
        "prescriptions",
        "items",
        "data",
      ]);

      const duplicate = existing.some(
        (item) => Number(item.consultation_id) === Number(consultation.id),
      );

      if (duplicate) {
        throw new Error("Prescription already exists.");
      }

      const response = await fetch(`${API}/prescriptions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: Number(selectedAppointment.patient_id),
          doctor_id: doctorId,
          consultation_id: Number(consultation.id),
          medicine_name: prescriptionMedicine.trim(),
          dosage: prescriptionDosage.trim(),
          frequency: prescriptionFrequency.trim(),
          duration: prescriptionDuration.trim(),
          instructions: prescriptionInstructions.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to save prescription",
        );
      }

      alert("Prescription saved successfully!");

      closePrescription();
      await loadMedicalStatus();
    } catch (err) {
      setPrescriptionError(err.message);
    } finally {
      setSavingPrescription(false);
    }
  };

  const closePrescription = () => {
    setShowPrescription(false);
    setSelectedAppointment(null);

    setPrescriptionMedicine("");
    setPrescriptionDosage("");
    setPrescriptionFrequency("");
    setPrescriptionDuration("");
    setPrescriptionInstructions("");
    setPrescriptionError("");
  };

  // =========================================================
  // PRESCRIPTION - VIEW
  // =========================================================

  const openPrescriptionDetails = async (appointment) => {
    try {
      closeAllSections();

      setSelectedAppointment(appointment);
      setShowPrescriptionDetails(true);
      setPrescriptionLoading(true);
      setPrescriptionViewError("");

      const [prescriptionResponse, consultationResponse] = await Promise.all([
        fetch(`${API}/prescriptions/`),
        fetch(`${API}/consultations/`),
      ]);

      const prescriptionData = await prescriptionResponse.json();

      const consultationData = await consultationResponse.json();

      const prescriptions = getArrayData(prescriptionData, [
        "prescriptions",
        "items",
        "data",
      ]);

      const consultations = getArrayData(consultationData, [
        "consultations",
        "items",
        "data",
      ]);

      const consultationIds = consultations
        .filter(
          (item) =>
            Number(item.doctor_id) === Number(doctorId) &&
            Number(item.patient_id) === Number(appointment.patient_id) &&
            Number(item.appointment_id) === Number(appointment.id),
        )
        .map((item) => Number(item.id));

      const matching = prescriptions.filter(
        (item) =>
          Number(item.doctor_id) === Number(doctorId) &&
          Number(item.patient_id) === Number(appointment.patient_id) &&
          consultationIds.includes(Number(item.consultation_id)),
      );

      setPrescriptionDetails(matching);
    } catch (err) {
      setPrescriptionViewError(err.message);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const closePrescriptionDetails = () => {
    setShowPrescriptionDetails(false);
    setSelectedAppointment(null);
    setPrescriptionDetails([]);
    setPrescriptionViewError("");
  };

  // =========================================================
  // VITALS - VIEW
  // =========================================================

  const openVitals = async (appointment) => {
    try {
      closeAllSections();

      setSelectedAppointment(appointment);
      setShowVitals(true);
      setVitalsLoading(true);
      setVitalsError("");

      const response = await fetch(
        `${API}/vitals/patient/${appointment.patient_id}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to load vitals",
        );
      }

      setPatientVitals(getArrayData(data, ["vitals", "items", "data"]));
    } catch (err) {
      setVitalsError(err.message);
    } finally {
      setVitalsLoading(false);
    }
  };

  // =========================================================
  // VITALS - ADD
  // =========================================================

  const openVitalsForm = (appointment) => {
    const patientId = Number(appointment.patient_id);

    if ((vitalsDataByPatient[patientId] || []).length) {
      alert("Vitals already exist. Please use View Vitals.");
      return;
    }

    closeAllSections();

    setSelectedAppointment(appointment);

    setVitalTemperature("");
    setVitalBloodPressure("");
    setVitalHeartRate("");
    setVitalOxygenLevel("");
    setVitalSaveError("");

    setShowVitalsForm(true);
  };

  const saveVitals = async () => {
    if (!selectedAppointment) return;

    if (!vitalTemperature) {
      setVitalSaveError("Please enter temperature.");
      return;
    }

    if (!vitalBloodPressure.trim()) {
      setVitalSaveError("Please enter blood pressure.");
      return;
    }

    if (!vitalHeartRate) {
      setVitalSaveError("Please enter heart rate.");
      return;
    }

    if (!vitalOxygenLevel) {
      setVitalSaveError("Please enter oxygen level.");
      return;
    }

    try {
      setSavingVitals(true);
      setVitalSaveError("");

      const response = await fetch(`${API}/vitals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: Number(selectedAppointment.patient_id),
          temperature: Number(vitalTemperature),
          blood_pressure: vitalBloodPressure.trim(),
          heart_rate: Number(vitalHeartRate),
          oxygen_level: Number(vitalOxygenLevel),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to save vitals",
        );
      }

      alert("Vitals saved successfully!");

      const appointment = selectedAppointment;

      setShowVitalsForm(false);
      setSelectedAppointment(null);

      const appointmentData = await loadAppointments();

      await loadVitalsStatus(appointmentData);

      await openVitals(appointment);
    } catch (err) {
      setVitalSaveError(err.message);
    } finally {
      setSavingVitals(false);
    }
  };

  const closeVitals = () => {
    setShowVitals(false);
    setSelectedAppointment(null);
    setPatientVitals([]);
    setVitalsError("");
  };

  const closeVitalsForm = () => {
    setShowVitalsForm(false);
    setSelectedAppointment(null);
    setVitalSaveError("");
  };

  // =========================================================
  // LAB - VIEW
  // =========================================================

  const openLabReports = async (appointment) => {
    try {
      closeAllSections();

      setSelectedAppointment(appointment);
      setShowLabReports(true);
      setLabLoading(true);
      setLabError("");

      const [reportsResponse, testsResponse] = await Promise.all([
        fetch(`${API}/lab-reports/`),
        fetch(`${API}/lab-tests/`),
      ]);

      const reportsData = await reportsResponse.json();
      const testsData = await testsResponse.json();

      if (!reportsResponse.ok) {
        throw new Error("Failed to load lab reports");
      }

      if (!testsResponse.ok) {
        throw new Error("Failed to load lab tests");
      }

      const reports = getArrayData(reportsData, [
        "reports",
        "lab_reports",
        "items",
        "data",
      ]);

      const tests = getArrayData(testsData, [
        "tests",
        "lab_tests",
        "items",
        "data",
      ]);

      const patientId = Number(appointment.patient_id);

      const patientTests = tests.filter(
        (test) =>
          Number(test.patient_id) === patientId &&
          Number(test.doctor_id) === Number(doctorId),
      );

      const testIds = new Set(patientTests.map((test) => Number(test.id)));

      const patientReports = reports.filter(
        (report) =>
          Number(report.patient_id) === patientId &&
          testIds.has(Number(report.lab_test_id)),
      );

      setLabTests(patientTests);
      setLabReports(patientReports);
    } catch (err) {
      setLabError(err.message);
    } finally {
      setLabLoading(false);
    }
  };

  // =========================================================
  // LAB TEST - ADD
  // =========================================================

  const openLabTestForm = (appointment) => {
    const patientId = Number(appointment.patient_id);

    const status = labDataByPatient[patientId] || {
      tests: [],
    };

    if (status.tests.length) {
      alert("Lab test already exists. Please use View Lab Test.");
      return;
    }

    closeAllSections();

    setSelectedAppointment(appointment);
    setLabTestName("");
    setLabTestDescription("");
    setLabTestError("");

    setShowLabTestForm(true);
  };

  const saveLabTest = async () => {
    if (!selectedAppointment) return;

    if (!labTestName.trim()) {
      setLabTestError("Please enter lab test name.");
      return;
    }

    if (!labTestDescription.trim()) {
      setLabTestError("Please enter lab test description.");
      return;
    }

    try {
      setSavingLabTest(true);
      setLabTestError("");

      const response = await fetch(`${API}/lab-tests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: Number(selectedAppointment.patient_id),
          doctor_id: doctorId,
          appointment_id: Number(selectedAppointment.id),
          test_name: labTestName.trim(),
          test_description: labTestDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to create lab test",
        );
      }

      alert("Lab test created successfully!");

      const appointment = selectedAppointment;

      setShowLabTestForm(false);
      setSelectedAppointment(null);

      const appointmentData = await loadAppointments();

      await loadLabStatus(appointmentData);

      await openLabReports(appointment);
    } catch (err) {
      setLabTestError(err.message);
    } finally {
      setSavingLabTest(false);
    }
  };

  const closeLabTestForm = () => {
    setShowLabTestForm(false);
    setSelectedAppointment(null);
    setLabTestError("");
  };

  // =========================================================
  // LAB REPORT - ADD
  // =========================================================

  const openLabReportForm = async (appointment) => {
    try {
      closeAllSections();

      const [testsResponse, reportsResponse] = await Promise.all([
        fetch(`${API}/lab-tests/`),
        fetch(`${API}/lab-reports/`),
      ]);

      const testsData = await testsResponse.json();
      const reportsData = await reportsResponse.json();

      const tests = getArrayData(testsData, [
        "tests",
        "lab_tests",
        "items",
        "data",
      ]);

      const reports = getArrayData(reportsData, [
        "reports",
        "lab_reports",
        "items",
        "data",
      ]);

      const patientId = Number(appointment.patient_id);

      const patientTests = tests.filter(
        (test) =>
          Number(test.patient_id) === patientId &&
          Number(test.doctor_id) === Number(doctorId),
      );

      const patientTestIds = new Set(
        patientTests.map((test) => Number(test.id)),
      );

      const patientReports = reports.filter(
        (report) =>
          Number(report.patient_id) === patientId &&
          patientTestIds.has(Number(report.lab_test_id)),
      );

      const completedTestIds = new Set(
        patientReports.map((report) => Number(report.lab_test_id)),
      );

      const pendingTests = patientTests.filter(
        (test) => !completedTestIds.has(Number(test.id)),
      );

      if (!pendingTests.length) {
        alert("No pending lab test is available.");
        return;
      }

      closeAllSections();

      setSelectedAppointment(appointment);
      setLabTests(pendingTests);
      setSelectedLabTestId(String(pendingTests[0].id));

      setLabResult("");
      setLabResultValue("");
      setLabNormalRange("");
      setLabReportStatus("completed");
      setLabReportSaveError("");

      setShowLabReportForm(true);
    } catch (err) {
      setLabReportSaveError(err.message);
    }
  };

  const saveLabReport = async () => {
    if (!selectedAppointment) return;

    if (!selectedLabTestId) {
      setLabReportSaveError("Please select lab test.");
      return;
    }

    if (!labResult.trim()) {
      setLabReportSaveError("Please enter result.");
      return;
    }

    if (!labResultValue.trim()) {
      setLabReportSaveError("Please enter result value.");
      return;
    }

    if (!labNormalRange.trim()) {
      setLabReportSaveError("Please enter normal range.");
      return;
    }

    try {
      setSavingLabReport(true);
      setLabReportSaveError("");

      const response = await fetch(`${API}/lab-reports/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lab_test_id: Number(selectedLabTestId),
          patient_id: Number(selectedAppointment.patient_id),
          result: labResult.trim(),
          result_value: labResultValue.trim(),
          normal_range: labNormalRange.trim(),
          report_status: labReportStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to save lab report",
        );
      }

      alert("Lab report saved successfully!");

      const appointment = selectedAppointment;

      setShowLabReportForm(false);
      setSelectedAppointment(null);

      const appointmentData = await loadAppointments();

      await loadLabStatus(appointmentData);

      await openLabReports(appointment);
    } catch (err) {
      setLabReportSaveError(err.message);
    } finally {
      setSavingLabReport(false);
    }
  };

  const closeLabReportForm = () => {
    setShowLabReportForm(false);
    setSelectedAppointment(null);
    setLabReportSaveError("");
  };

  const closeLabReports = () => {
    setShowLabReports(false);
    setSelectedAppointment(null);
    setLabTests([]);
    setLabReports([]);
    setLabError("");
  };

  // =========================================================
  // PATIENT SELECTOR ACTIONS
  // =========================================================

  const selectedPatientVitals = () => {
    if (!selectedPatientAppointment) {
      alert("Please select a patient.");
      return;
    }

    const patientId = Number(selectedPatientAppointment.patient_id);

    const hasVitals = (vitalsDataByPatient[patientId] || []).length > 0;

    if (hasVitals) {
      openVitals(selectedPatientAppointment);
    } else {
      openVitalsForm(selectedPatientAppointment);
    }
  };

  const selectedPatientConsultation = () => {
    if (!selectedPatientAppointment) {
      alert("Please select a patient.");
      return;
    }

    const patientId = Number(selectedPatientAppointment.patient_id);

    if (consultationPatientIds.includes(patientId)) {
      openConsultationDetails(selectedPatientAppointment);
    } else {
      openConsultation(selectedPatientAppointment);
    }
  };

  const selectedPatientPrescription = () => {
    if (!selectedPatientAppointment) {
      alert("Please select a patient.");
      return;
    }

    const patientId = Number(selectedPatientAppointment.patient_id);

    if (!consultationPatientIds.includes(patientId)) {
      alert("Please add consultation first.");
      return;
    }

    const appointmentId = Number(selectedPatientAppointment.id);

    const consultationId = Object.keys(consultationMap).find(
      (id) =>
        Number(consultationMap[id].appointmentId) === appointmentId &&
        Number(consultationMap[id].patientId) === patientId,
    );

    if (
      consultationId &&
      prescriptionConsultationIds.includes(Number(consultationId))
    ) {
      openPrescriptionDetails(selectedPatientAppointment);
    } else {
      openPrescription(selectedPatientAppointment);
    }
  };

  const selectedPatientLab = () => {
    if (!selectedPatientAppointment) {
      alert("Please select a patient.");
      return;
    }

    const patientId = Number(selectedPatientAppointment.patient_id);

    const status = labDataByPatient[patientId] || {
      tests: [],
      reports: [],
      pendingTests: [],
    };

    if (!status.tests.length) {
      openLabTestForm(selectedPatientAppointment);
      return;
    }

    if (status.pendingTests.length) {
      openLabReportForm(selectedPatientAppointment);
      return;
    }

    openLabReports(selectedPatientAppointment);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (userRole !== "doctor" || !doctorId) {
    return null;
  }

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="doctor-container">
          <h2>Loading Doctor Dashboard...</h2>
        </div>
      </div>
    );
  }

  // =========================================================
  // SUMMARY
  // =========================================================

  const waitingPatients = queue.filter(
    (item) => item.status === "waiting",
  ).length;

  const servingPatients = queue.filter(
    (item) => item.status === "serving",
  ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="doctor-dashboard">
      <div className="doctor-container">
        {/* HEADER */}

        <div className="doctor-header">
          <div>
            <h1>👨‍⚕️ Doctor Dashboard</h1>

            <p>Welcome, Dr. {doctorName || "Doctor"}</p>

            <p>Doctor ID: {doctorId}</p>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>

        {error && <div className="doctor-error">❌ {error}</div>}

        {/* SUMMARY */}

        <div className="doctor-summary">
          <div className="summary-card">
            <h3>📅 Appointments</h3>
            <strong>{appointments.length}</strong>
          </div>

          <div className="summary-card">
            <h3>👥 Waiting Patients</h3>
            <strong>{waitingPatients}</strong>
          </div>

          <div className="summary-card">
            <h3>🩺 Serving</h3>
            <strong>{servingPatients}</strong>
          </div>
        </div>

        {/* =====================================================
            CONSULTATION DETAILS
        ===================================================== */}

        {showConsultationDetails && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>🩺 Consultation Details</h2>

              <button onClick={closeConsultationDetails}>❌ Close</button>
            </div>

            <div className="appointment-info">
              <p>
                <strong>👤 Patient:</strong>{" "}
                {selectedAppointment.patient_name ||
                  `Patient ${selectedAppointment.patient_id}`}
              </p>

              <p>
                <strong>🆔 Patient ID:</strong> {selectedAppointment.patient_id}
              </p>

              <p>
                <strong>📋 Appointment ID:</strong> {selectedAppointment.id}
              </p>
            </div>

            {consultationViewError && (
              <div className="doctor-error">❌ {consultationViewError}</div>
            )}

            {consultationLoading ? (
              <div className="empty-message">Loading consultation...</div>
            ) : consultationDetails.length === 0 ? (
              <div className="empty-message">No consultation found.</div>
            ) : (
              <div className="appointments-grid">
                {consultationDetails.map((item) => (
                  <div className="doctor-appointment" key={item.id}>
                    <h3>🩺 Consultation #{item.id}</h3>

                    <div className="appointment-info">
                      <p>
                        <strong>🤒 Symptoms:</strong>{" "}
                        {item.symptoms || "Not provided"}
                      </p>

                      <p>
                        <strong>🔍 Diagnosis:</strong>{" "}
                        {item.diagnosis || "Not provided"}
                      </p>

                      <p>
                        <strong>📝 Notes:</strong>{" "}
                        {item.notes || "Not provided"}
                      </p>

                      <p>
                        <strong>📅 Date:</strong>{" "}
                        {formatDateTime(item.consultation_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            PRESCRIPTION DETAILS
        ===================================================== */}

        {showPrescriptionDetails && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>💊 Prescription Details</h2>

              <button onClick={closePrescriptionDetails}>❌ Close</button>
            </div>

            <div className="appointment-info">
              <p>
                <strong>👤 Patient:</strong>{" "}
                {selectedAppointment.patient_name ||
                  `Patient ${selectedAppointment.patient_id}`}
              </p>

              <p>
                <strong>🆔 Patient ID:</strong> {selectedAppointment.patient_id}
              </p>
            </div>

            {prescriptionViewError && (
              <div className="doctor-error">❌ {prescriptionViewError}</div>
            )}

            {prescriptionLoading ? (
              <div className="empty-message">Loading prescription...</div>
            ) : prescriptionDetails.length === 0 ? (
              <div className="empty-message">No prescription found.</div>
            ) : (
              <div className="appointments-grid">
                {prescriptionDetails.map((item) => (
                  <div className="doctor-appointment" key={item.id}>
                    <h3>💊 Prescription #{item.id}</h3>

                    <div className="appointment-info">
                      <p>
                        <strong>💊 Medicine:</strong> {item.medicine_name}
                      </p>

                      <p>
                        <strong>💉 Dosage:</strong> {item.dosage}
                      </p>

                      <p>
                        <strong>🕐 Frequency:</strong> {item.frequency}
                      </p>

                      <p>
                        <strong>📅 Duration:</strong> {item.duration}
                      </p>

                      <p>
                        <strong>📝 Instructions:</strong>{" "}
                        {item.instructions || "None"}
                      </p>

                      <p>
                        <strong>📋 Consultation ID:</strong>{" "}
                        {item.consultation_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            VITALS DETAILS
        ===================================================== */}

        {showVitals && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>❤️ Patient Vitals</h2>

              <button onClick={closeVitals}>❌ Close</button>
            </div>

            <div className="appointment-info">
              <p>
                <strong>👤 Patient:</strong>{" "}
                {selectedAppointment.patient_name ||
                  `Patient ${selectedAppointment.patient_id}`}
              </p>

              <p>
                <strong>🆔 Patient ID:</strong> {selectedAppointment.patient_id}
              </p>
            </div>

            {vitalsError && (
              <div className="doctor-error">❌ {vitalsError}</div>
            )}

            {vitalsLoading ? (
              <div className="empty-message">Loading vitals...</div>
            ) : patientVitals.length === 0 ? (
              <div className="empty-message">No vitals recorded.</div>
            ) : (
              <div className="appointments-grid">
                {patientVitals.map((vital) => (
                  <div className="doctor-appointment" key={vital.id}>
                    <h3>❤️ Vital Record #{vital.id}</h3>

                    <div className="appointment-info">
                      <p>
                        <strong>🌡️ Temperature:</strong> {vital.temperature} °F
                      </p>

                      <p>
                        <strong>🩸 Blood Pressure:</strong>{" "}
                        {vital.blood_pressure}
                      </p>

                      <p>
                        <strong>❤️ Heart Rate:</strong> {vital.heart_rate} bpm
                      </p>

                      <p>
                        <strong>🫁 Oxygen:</strong> {vital.oxygen_level}%
                      </p>

                      <p>
                        <strong>📅 Recorded:</strong>{" "}
                        {formatDateTime(vital.recorded_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            ADD VITALS
        ===================================================== */}

        {showVitalsForm && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>❤️ Add Patient Vitals</h2>

              <button onClick={closeVitalsForm}>❌ Close</button>
            </div>

            {vitalSaveError && (
              <div className="doctor-error">❌ {vitalSaveError}</div>
            )}

            <div className="consultation-form">
              <div className="form-group">
                <label>🌡️ Temperature</label>

                <input
                  type="number"
                  step="0.1"
                  value={vitalTemperature}
                  onChange={(e) => setVitalTemperature(e.target.value)}
                  placeholder="98.6"
                />
              </div>

              <div className="form-group">
                <label>🩸 Blood Pressure</label>

                <input
                  value={vitalBloodPressure}
                  onChange={(e) => setVitalBloodPressure(e.target.value)}
                  placeholder="120/80"
                />
              </div>

              <div className="form-group">
                <label>❤️ Heart Rate</label>

                <input
                  type="number"
                  value={vitalHeartRate}
                  onChange={(e) => setVitalHeartRate(e.target.value)}
                  placeholder="72"
                />
              </div>

              <div className="form-group">
                <label>🫁 Oxygen Level</label>

                <input
                  type="number"
                  step="0.1"
                  value={vitalOxygenLevel}
                  onChange={(e) => setVitalOxygenLevel(e.target.value)}
                  placeholder="98"
                />
              </div>

              <div className="appointment-actions">
                <button
                  className="start-button"
                  onClick={saveVitals}
                  disabled={savingVitals}
                >
                  {savingVitals ? "Saving..." : "💾 Save Vitals"}
                </button>

                <button className="view-button" onClick={closeVitalsForm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            CONSULTATION FORM
        ===================================================== */}

        {showConsultation && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>🩺 Consultation</h2>

              <button onClick={closeConsultation}>❌ Close</button>
            </div>

            {consultationError && (
              <div className="doctor-error">❌ {consultationError}</div>
            )}

            <div className="consultation-form">
              <div className="form-group">
                <label>Symptoms</label>

                <textarea
                  rows="4"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Enter patient symptoms"
                />
              </div>

              <div className="form-group">
                <label>Diagnosis</label>

                <textarea
                  rows="4"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>

                <textarea
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter consultation notes"
                />
              </div>

              <div className="appointment-actions">
                <button
                  className="start-button"
                  onClick={saveConsultation}
                  disabled={savingConsultation}
                >
                  {savingConsultation ? "Saving..." : "💾 Save Consultation"}
                </button>

                <button className="view-button" onClick={closeConsultation}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            PRESCRIPTION FORM
        ===================================================== */}

        {showPrescription && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>💊 Prescription</h2>

              <button onClick={closePrescription}>❌ Close</button>
            </div>

            {prescriptionError && (
              <div className="doctor-error">❌ {prescriptionError}</div>
            )}

            <div className="consultation-form">
              <div className="form-group">
                <label>💊 Medicine Name</label>

                <input
                  value={prescriptionMedicine}
                  onChange={(e) => setPrescriptionMedicine(e.target.value)}
                  placeholder="Paracetamol"
                />
              </div>

              <div className="form-group">
                <label>💉 Dosage</label>

                <input
                  value={prescriptionDosage}
                  onChange={(e) => setPrescriptionDosage(e.target.value)}
                  placeholder="500 mg"
                />
              </div>

              <div className="form-group">
                <label>🕐 Frequency</label>

                <input
                  value={prescriptionFrequency}
                  onChange={(e) => setPrescriptionFrequency(e.target.value)}
                  placeholder="Twice a day"
                />
              </div>

              <div className="form-group">
                <label>📅 Duration</label>

                <input
                  value={prescriptionDuration}
                  onChange={(e) => setPrescriptionDuration(e.target.value)}
                  placeholder="5 days"
                />
              </div>

              <div className="form-group">
                <label>📝 Instructions</label>

                <textarea
                  rows="4"
                  value={prescriptionInstructions}
                  onChange={(e) => setPrescriptionInstructions(e.target.value)}
                  placeholder="Take after food"
                />
              </div>

              <div className="appointment-actions">
                <button
                  className="start-button"
                  onClick={savePrescription}
                  disabled={savingPrescription}
                >
                  {savingPrescription ? "Saving..." : "💾 Save Prescription"}
                </button>

                <button className="view-button" onClick={closePrescription}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            LAB REPORT VIEW
        ===================================================== */}

        {showLabReports && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>🧪 Lab Reports</h2>

              <button onClick={closeLabReports}>❌ Close</button>
            </div>

            <div className="appointment-info">
              <p>
                <strong>👤 Patient:</strong>{" "}
                {selectedAppointment.patient_name ||
                  `Patient ${selectedAppointment.patient_id}`}
              </p>

              <p>
                <strong>🆔 Patient ID:</strong> {selectedAppointment.patient_id}
              </p>
            </div>

            {labError && <div className="doctor-error">❌ {labError}</div>}

            {labLoading ? (
              <div className="empty-message">Loading lab information...</div>
            ) : (
              <>
                <h3>🔬 Lab Tests</h3>

                {labTests.length === 0 ? (
                  <div className="empty-message">No lab test found.</div>
                ) : (
                  <div className="appointments-grid">
                    {labTests.map((test) => (
                      <div className="doctor-appointment" key={test.id}>
                        <h3>🔬 {test.test_name}</h3>

                        <p>
                          <strong>Test ID:</strong> {test.id}
                        </p>

                        <p>
                          <strong>Description:</strong> {test.test_description}
                        </p>

                        <p>
                          <strong>Status:</strong> {test.status || "Requested"}
                        </p>

                        <p>
                          <strong>Requested:</strong>{" "}
                          {formatDateTime(test.requested_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <h3>🧪 Lab Reports</h3>

                {labReports.length === 0 ? (
                  <div className="empty-message">No lab report found.</div>
                ) : (
                  <div className="appointments-grid">
                    {labReports.map((report) => (
                      <div className="doctor-appointment" key={report.id}>
                        <h3>🧪 Report #{report.id}</h3>

                        <p>
                          <strong>Result:</strong> {report.result}
                        </p>

                        <p>
                          <strong>Result Value:</strong> {report.result_value}
                        </p>

                        <p>
                          <strong>Normal Range:</strong> {report.normal_range}
                        </p>

                        <p>
                          <strong>Status:</strong> {report.report_status}
                        </p>

                        <p>
                          <strong>Date:</strong>{" "}
                          {formatDateTime(report.report_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* =====================================================
            LAB TEST FORM
        ===================================================== */}

        {showLabTestForm && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>🔬 Create Lab Test</h2>

              <button onClick={closeLabTestForm}>❌ Close</button>
            </div>

            {labTestError && (
              <div className="doctor-error">❌ {labTestError}</div>
            )}

            <div className="consultation-form">
              <div className="form-group">
                <label>🔬 Test Name</label>

                <input
                  value={labTestName}
                  onChange={(e) => setLabTestName(e.target.value)}
                  placeholder="Blood Test"
                />
              </div>

              <div className="form-group">
                <label>📝 Test Description</label>

                <textarea
                  rows="4"
                  value={labTestDescription}
                  onChange={(e) => setLabTestDescription(e.target.value)}
                  placeholder="Complete Blood Count"
                />
              </div>

              <div className="appointment-actions">
                <button
                  className="start-button"
                  onClick={saveLabTest}
                  disabled={savingLabTest}
                >
                  {savingLabTest ? "Creating..." : "💾 Create Lab Test"}
                </button>

                <button className="view-button" onClick={closeLabTestForm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            LAB REPORT FORM
        ===================================================== */}

        {showLabReportForm && selectedAppointment && (
          <div className="doctor-card">
            <div className="card-header">
              <h2>🧪 Add Lab Report</h2>

              <button onClick={closeLabReportForm}>❌ Close</button>
            </div>

            {labReportSaveError && (
              <div className="doctor-error">❌ {labReportSaveError}</div>
            )}

            <div className="consultation-form">
              <div className="form-group">
                <label>🔬 Select Lab Test</label>

                <select
                  value={selectedLabTestId}
                  onChange={(e) => setSelectedLabTestId(e.target.value)}
                >
                  <option value="">Select lab test</option>

                  {labTests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.id} - {test.test_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>📊 Result</label>

                <input
                  value={labResult}
                  onChange={(e) => setLabResult(e.target.value)}
                  placeholder="Normal"
                />
              </div>

              <div className="form-group">
                <label>📈 Result Value</label>

                <input
                  value={labResultValue}
                  onChange={(e) => setLabResultValue(e.target.value)}
                  placeholder="WBC: 7000 cells/uL"
                />
              </div>

              <div className="form-group">
                <label>📏 Normal Range</label>

                <input
                  value={labNormalRange}
                  onChange={(e) => setLabNormalRange(e.target.value)}
                  placeholder="4000 - 11000 cells/uL"
                />
              </div>

              <div className="form-group">
                <label>✅ Report Status</label>

                <select
                  value={labReportStatus}
                  onChange={(e) => setLabReportStatus(e.target.value)}
                >
                  <option value="completed">Completed</option>

                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="appointment-actions">
                <button
                  className="start-button"
                  onClick={saveLabReport}
                  disabled={savingLabReport}
                >
                  {savingLabReport ? "Saving..." : "💾 Save Lab Report"}
                </button>

                <button className="view-button" onClick={closeLabReportForm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            APPOINTMENTS
        ===================================================== */}

        <div className="doctor-card">
          <div className="card-header">
            <h2>📋 My Appointments</h2>

            <button onClick={loadDashboard}>🔄 Refresh</button>
          </div>

          {appointments.length === 0 ? (
            <div className="empty-message">No appointments found.</div>
          ) : (
            <div className="appointments-grid">
              {appointments.map((appointment) => {
                const patientId = Number(appointment.patient_id);

                const hasConsultation =
                  consultationPatientIds.includes(patientId);

                const consultationId = Object.keys(consultationMap).find(
                  (id) =>
                    Number(consultationMap[id].patientId) === patientId &&
                    Number(consultationMap[id].appointmentId) ===
                      Number(appointment.id),
                );

                const hasPrescription = consultationId
                  ? prescriptionConsultationIds.includes(Number(consultationId))
                  : false;

                const labStatus = labDataByPatient[patientId] || {
                  tests: [],
                  reports: [],
                  pendingTests: [],
                };

                const hasLabTest = labStatus.tests.length > 0;

                const hasLabReport = labStatus.reports.length > 0;

                const hasPendingLabReport = labStatus.pendingTests.length > 0;

                const hasVitals =
                  (vitalsDataByPatient[patientId] || []).length > 0;

                return (
                  <div className="doctor-appointment" key={appointment.id}>
                    <div className="appointment-top">
                      <h3>Appointment: {appointment.id}</h3>

                      <span className={`status ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="appointment-info">
                      <p>
                        <strong>👤 Patient:</strong>{" "}
                        {appointment.patient_name || `Patient ${patientId}`}
                      </p>

                      <p>
                        <strong>🆔 Patient ID:</strong> {patientId}
                      </p>

                      <p>
                        <strong>🏥 Department:</strong>{" "}
                        {appointment.department_name ||
                          `Department ${appointment.department_id}`}
                      </p>

                      <p>
                        <strong>📅 Date:</strong>{" "}
                        {appointment.appointment_date
                          ? String(appointment.appointment_date).split("T")[0]
                          : "Not available"}
                      </p>

                      <p>
                        <strong>📝 Reason:</strong>{" "}
                        {appointment.reason || "Not provided"}
                      </p>
                    </div>

                    <div className="appointment-actions">
                      {/* CONSULTATION */}

                      {!hasConsultation ? (
                        <button
                          className="start-button"
                          onClick={() => openConsultation(appointment)}
                        >
                          🩺 Add Consultation
                        </button>
                      ) : (
                        <button
                          className="view-button"
                          onClick={() => openConsultationDetails(appointment)}
                        >
                          🩺 View Consultation
                        </button>
                      )}

                      {/* PRESCRIPTION */}

                      {hasPrescription ? (
                        <button
                          className="view-button"
                          onClick={() => openPrescriptionDetails(appointment)}
                        >
                          💊 View Prescription
                        </button>
                      ) : hasConsultation ? (
                        <button
                          className="start-button"
                          onClick={() => openPrescription(appointment)}
                        >
                          💊 Add Prescription
                        </button>
                      ) : null}

                      {/* LAB TEST */}

                      {!hasLabTest ? (
                        <button
                          className="start-button"
                          onClick={() => openLabTestForm(appointment)}
                        >
                          🔬 Add Lab Test
                        </button>
                      ) : (
                        <button
                          className="view-button"
                          onClick={() => openLabReports(appointment)}
                        >
                          🔬 View Lab Test
                        </button>
                      )}

                      {/* LAB REPORT */}

                      {hasLabTest && hasPendingLabReport ? (
                        <button
                          className="start-button"
                          onClick={() => openLabReportForm(appointment)}
                        >
                          🧪 Add Lab Report
                        </button>
                      ) : hasLabReport ? (
                        <button
                          className="view-button"
                          onClick={() => openLabReports(appointment)}
                        >
                          🧪 View Lab Report
                        </button>
                      ) : null}

                      {/* VITALS */}

                      {!hasVitals ? (
                        <button
                          className="start-button"
                          onClick={() => openVitalsForm(appointment)}
                        >
                          ❤️ Add Vitals
                        </button>
                      ) : (
                        <button
                          className="view-button"
                          onClick={() => openVitals(appointment)}
                        >
                          ❤️ View Vitals
                        </button>
                      )}

                      <button
                        className="view-button"
                        onClick={() => alert(`Patient ID: ${patientId}`)}
                      >
                        👁️ View Patient
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================
            PATIENT QUEUE
        ===================================================== */}

        <div className="doctor-card">
          <div className="card-header">
            <h2>🎫 Patient Queue</h2>

            <button onClick={loadQueue}>🔄 Refresh</button>
          </div>

          {queueError && <div className="doctor-error">❌ {queueError}</div>}

          {queueLoading ? (
            <div className="empty-message">Loading queue...</div>
          ) : queue.length === 0 ? (
            <div className="empty-message">🎫 No patients in your queue.</div>
          ) : (
            <div className="appointments-grid">
              {queue.map((token) => (
                <div className="doctor-appointment" key={token.id}>
                  <div className="appointment-top">
                    <h3>🎫 Token: {token.token_number}</h3>

                    <span className={`status ${token.status}`}>
                      {token.status}
                    </span>
                  </div>

                  <div className="appointment-info">
                    <p>
                      <strong>👤 Patient ID:</strong> {token.patient_id}
                    </p>

                    <p>
                      <strong>📋 Appointment:</strong> {token.appointment_id}
                    </p>

                    <p>
                      <strong>👥 Patients Ahead:</strong>{" "}
                      {token.patients_ahead ?? 0}
                    </p>

                    <p>
                      <strong>⏳ Estimated Waiting:</strong>{" "}
                      {token.estimated_waiting_time ?? 0} minutes
                    </p>
                  </div>

                  <div className="appointment-actions">
                    {token.status === "waiting" && (
                      <button
                        className="start-button"
                        onClick={() => updateQueueStatus(token.id, "serving")}
                      >
                        ▶️ Start Serving
                      </button>
                    )}

                    {token.status === "serving" && (
                      <button
                        className="start-button"
                        onClick={() => updateQueueStatus(token.id, "completed")}
                      >
                        ✅ Complete Patient
                      </button>
                    )}

                    {token.status === "completed" && (
                      <button className="view-button" disabled>
                        ✅ Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================
            FINAL PATIENT MEDICAL INFORMATION
        ===================================================== */}

        <div className="doctor-card">
          <div className="card-header">
            <div>
              <h2>🩺 Patient Medical Information</h2>

              <p>Select a patient to view or manage their records.</p>
            </div>
          </div>

          {uniquePatients.length === 0 ? (
            <div className="empty-message">No patients available.</div>
          ) : (
            <>
              {/* PATIENT SELECTOR */}

              <div
                className="form-group"
                style={{
                  maxWidth: "500px",
                  marginBottom: "20px",
                }}
              >
                <label>
                  <strong>👤 Select Patient</strong>
                </label>

                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    closeAllSections();
                    setSelectedPatientId(e.target.value);
                  }}
                >
                  <option value="">Select Patient</option>

                  {uniquePatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} — ID: {patient.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTED PATIENT */}

              {selectedPatient && (
                <div
                  className="appointment-info"
                  style={{
                    marginBottom: "20px",
                  }}
                >
                  <p>
                    <strong>👤 Patient:</strong> {selectedPatient.name}
                  </p>

                  <p>
                    <strong>🆔 Patient ID:</strong> {selectedPatient.id}
                  </p>

                  {selectedPatientAppointment && (
                    <p>
                      <strong>📋 Appointment ID:</strong>{" "}
                      {selectedPatientAppointment.id}
                    </p>
                  )}
                </div>
              )}

              {/* MEDICAL ACTIONS */}

              <div className="medical-actions">
                <button
                  type="button"
                  disabled={!selectedPatientAppointment}
                  onClick={selectedPatientVitals}
                >
                  ❤️ Vitals
                </button>

                <button
                  type="button"
                  disabled={!selectedPatientAppointment}
                  onClick={selectedPatientConsultation}
                >
                  🩺 Consultation
                </button>

                <button
                  type="button"
                  disabled={!selectedPatientAppointment}
                  onClick={selectedPatientPrescription}
                >
                  💊 Prescription
                </button>

                <button
                  type="button"
                  disabled={!selectedPatientAppointment}
                  onClick={selectedPatientLab}
                >
                  🧪 Lab Reports
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
