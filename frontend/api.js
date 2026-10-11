const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://nw48n1b1-8000.inc1.devtunnels.ms"
).replace(/\/+$/, "");

export default API_BASE_URL;
