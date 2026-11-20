// Tintu service compatibility adapter.
// Uses Srilekha's existing fetch helper so JWT and API base URL stay centralized.
import { request } from "../api";

const API_PREFIX = "/api/v1";

function buildPath(path, params) {
  let url = String(path || "");
  if (!url.startsWith("/")) url = `/${url}`;
  // Absolute API paths from Srilekha's ENDPOINTS stay unchanged.
  if (!url.startsWith("/api/")) url = `${API_PREFIX}${url}`;
  if (params && Object.keys(params).length) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString();
    if (suffix) url += `${url.includes("?") ? "&" : "?"}${suffix}`;
  }
  return url;
}

async function send(method, path, data, config = {}) {
  const url = buildPath(path, config.params);
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;
  const headers = { ...(config.headers || {}) };
  if (isForm) {
    // Let fetch add the multipart boundary automatically.
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === "content-type") delete headers[key];
    });
  }
  const options = { method, headers };
  if (data !== undefined && method !== "GET" && method !== "HEAD") {
    options.body = isForm ? data : JSON.stringify(data);
  }
  try {
    const result = await request(url, options);
    return { data: result, status: 200, headers: {} };
  } catch (error) {
    const match = String(error?.message || "").match(/\((\d{3})\)/);
    const status = match ? Number(match[1]) : 0;
    error.response = {
      status,
      data: { message: error?.message || "Request failed" },
    };
    throw error;
  }
}

const api = {
  get: (url, config) => send("GET", url, undefined, config),
  post: (url, data, config) => send("POST", url, data, config),
  put: (url, data, config) => send("PUT", url, data, config),
  patch: (url, data, config) => send("PATCH", url, data, config),
  delete: (url, config) => send("DELETE", url, undefined, config),
};

export default api;
