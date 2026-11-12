const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  // Add JSON content type for normal JSON requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add Bearer token only when authentication is required
  if (options.auth !== false) {
    const token = localStorage.getItem("token");

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Cannot reach the backend server. Please make sure the backend is running."
    );
  }

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed (${response.status}) at ${endpoint}`
    );
  }

  return data;
};

export default apiRequest;