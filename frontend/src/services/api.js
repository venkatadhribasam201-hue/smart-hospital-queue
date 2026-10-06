const API_URL = "http://127.0.0.1:8000";

// Get Queue
export const getQueue = async () => {
  const response = await fetch(`${API_URL}/queue/`);

  if (!response.ok) {
    throw new Error("Failed to fetch queue data");
  }

  return await response.json();
};

// Get Appointments
export const getAppointments = async () => {
  const response = await fetch(`${API_URL}/appointments/`);

  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }

  return await response.json();
};
// Get Doctors
export const getDoctors = async () => {
  const response = await fetch(`${API_URL}/doctors/`);

  if (!response.ok) {
    throw new Error("Failed to fetch doctors");
  }

  return await response.json();
};


// Get Departments
export const getDepartments = async () => {
  const response = await fetch(`${API_URL}/departments/`);

  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }

  return await response.json();
};