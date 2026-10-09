export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const sessionExpired = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
  return new Error("Session expired. Please log in again.");
};

// Naresh's endpoints sometimes return plain text, sometimes JSON
const parseError = async (response) => {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    const details = data.errors ? Object.values(data.errors).flat().join(", ") : "";
    return data.message || details || data.error || `Request failed (${response.status})`;
  } catch {
    return text || `Request failed (${response.status})`;
  }
};

export const request = async (path, options = {}) => {
  const token = getToken();
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`Cannot reach the server at ${API_URL}. Is the backend running?`);
  }

  if (response.status === 401) throw sessionExpired();
  if (response.status === 403) throw new Error("You do not have permission to do this.");
  if (!response.ok) throw new Error(await parseError(response));

  try {
    return await response.json();
  } catch {
    return {};
  }
};

// <iframe>/<img> cannot send the login token, so download the file with
// fetch() and give the browser a temporary blob: URL to display.
export const fetchBlobUrl = async (path) => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 401) throw sessionExpired();
  if (!response.ok) throw new Error("Could not load the file");
  return URL.createObjectURL(await response.blob());
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};