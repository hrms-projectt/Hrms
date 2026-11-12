import apiRequest from "./api";

export const signupUser = async ({
  fullName,
  email,
  companyName,
  password,
  confirmPassword,
  role,
}) => {
  return apiRequest("/api/v1/auth/signup", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      fullName,
      email,
      companyName,
      password,
      confirmPassword,
      role,
    }),
  });
};

export const loginUser = async ({
  email,
  password,
}) => {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email,
      password,
    }),
  });
};

export const forgotPassword = async (email) => {
  return apiRequest("/api/v1/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email,
    }),
  });
};