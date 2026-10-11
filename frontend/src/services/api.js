const API_URL =
  import.meta.env.VITE_API_URL || "https://nw48n1b1-8000.inc1.devtunnels.ms";

// Get selected hospital ID
const getSelectedHospitalId = (hospitalId) => {
  const id = hospitalId ?? localStorage.getItem("selectedHospitalId");

  if (id === null || id === undefined || String(id).trim() === "") {
    throw new Error("Please select a hospital first.");
  }

  return String(id);
};

// Build hospital-specific API URL
const buildHospitalUrl = (endpoint, hospitalId) => {
  const id = getSelectedHospitalId(hospitalId);
  const params = new URLSearchParams({ hospital_id: id });

  return `${API_URL}${endpoint}?${params.toString()}`;
};

// Common API request helper
const fetchData = async (url, errorMessage) => {
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${errorMessage} (HTTP ${response.status}): ${errorText}`);
  }

  return response.json();
};

// Get Queue for selected hospital
export const getQueue = async (hospitalId) => {
  const url = buildHospitalUrl("/queue/", hospitalId);
  return fetchData(url, "Failed to fetch queue data");
};

// Get Appointments for selected hospital
export const getAppointments = async (hospitalId) => {
  const url = buildHospitalUrl("/appointments/", hospitalId);
  return fetchData(url, "Failed to fetch appointments");
};

// Get Doctors for selected hospital
export const getDoctors = async (hospitalId) => {
  const url = buildHospitalUrl("/doctors/", hospitalId);
  return fetchData(url, "Failed to fetch doctors");
};

// Get Departments for selected hospital
export const getDepartments = async (hospitalId) => {
  const url = buildHospitalUrl("/departments/", hospitalId);
  return fetchData(url, "Failed to fetch departments");
};
