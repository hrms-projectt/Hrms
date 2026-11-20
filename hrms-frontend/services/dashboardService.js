import { request } from "./api";
import { ENDPOINTS } from "./endpoints";

const toList = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

const mapEmployee = (e) => ({
  id: e.id,
  name:
    e.fullName ||
    `${e.firstName || ""} ${e.lastName || ""}`.trim() ||
    "Unknown",
  email: e.email || e.employeeCode || "",
  department:
    (typeof e.department === "string" ? e.department : e.department?.name) ||
    e.organization?.name ||
    "-",
  status: (e.status || "ACTIVE").toUpperCase(),
});

// Loads everything the dashboard needs in parallel. If one API fails (for
// example a role is not allowed to read it) that part is returned as null and
// the page shows "-" instead of breaking.
export const getDashboardData = async () => {
  const results = await Promise.allSettled([
    request(ENDPOINTS.employees), // GET /api/employees
    request(ENDPOINTS.jobOpenings), // GET /api/v1/recruitment/job-openings
    request(ENDPOINTS.candidates), // GET /api/v1/recruitment/candidates
    request(ENDPOINTS.documents), // GET /api/v1/documents
  ]);

  if (results.every((r) => r.status === "rejected")) {
    throw results[0].reason;
  }

  const get = (r) => (r.status === "fulfilled" ? toList(r.value) : null);

  const employees = get(results[0]);
  return {
    employees: employees ? employees.map(mapEmployee) : null,
    jobs: get(results[1]),
    candidates: get(results[2]),
    documents: get(results[3]),
  };
};
