import api from "./api";

export const signup = (data) => api.post("/auth/signup", data);

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  const d = res.data || {};
  if (d.token) localStorage.setItem("token", d.token);

  const name = d.fullName || d.user?.fullName;
  if (name) localStorage.setItem("fullName", name);

  const role = d.role || d.user?.role;
  if (role) localStorage.setItem("role", role);

  const employeeId = d.employeeId || d.user?.employeeId;
  if (employeeId) localStorage.setItem("employeeId", String(employeeId));

  return res;
};

// POST /api/v1/auth/forgot-password   { email }
// The backend replies 404 if the email is not a registered user. In local mode it
// prints "RESET LINK" and "TOKEN" in the backend console instead of sending mail.
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);

// POST /api/v1/auth/reset-password   { token, newPassword }
// 200 { message } on success, 400 if the token is invalid or expired (15 minutes, one use)
export const resetPassword = (data) => api.post("/auth/reset-password", data);
