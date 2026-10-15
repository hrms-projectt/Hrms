// ALL backend URLs live here. If Naresh changes a URL, change ONLY this file.
export const ENDPOINTS = {
  // S-4 Add User
  roles: "/api/v1/roles",
  createUser: "/api/v1/users",

  // S-6 Recruitment
  candidates: "/api/v1/recruitment/candidates",
  candidateStatus: (id) => `/api/v1/recruitment/candidates/${id}/status`,
  convertCandidate: (id) => `/api/v1/recruitment/candidates/${id}/convert`,
  jobOpenings: "/api/v1/recruitment/job-openings",

  // S-7 Documents
  documents: "/api/v1/documents",
  documentFile: (id) => `/api/v1/documents/${id}/file`,
  documentVerify: (id) => `/api/v1/documents/${id}/verify`,
  documentReject: (id) => `/api/v1/documents/${id}/reject`,
  documentReupload: (id) => `/api/v1/documents/${id}/request-reupload`,

  // S-8 Shift Management
  shifts: "/api/v1/shifts",
  shift: (id) => `/api/v1/shifts/${id}`,

  // Dashboard
  employees: "/api/employees",
};
