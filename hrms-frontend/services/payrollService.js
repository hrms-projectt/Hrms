import { request } from "./api";
import { ENDPOINTS } from "./endpoints";

// Roles allowed on the payroll screens.
// If Naresh's finance role has another name, add it here (and in Sidebar.js).
export const PAYROLL_ROLES = ["SUPER_ADMIN", "HR_ADMIN", "FINANCE_ADMIN"];

export const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// "2026-10" -> "October 2026"
export const monthLabel = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month || "")) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export const currentMonth = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
};

// ---------- S-12 Salary Structure ----------

// POST /api/v1/payroll/components
//   { name, type: "EARNING" | "DEDUCTION", calculationType: "FIXED" | "PERCENTAGE", defaultValue }
export const createComponent = ({ name, type, calculationType, defaultValue }) =>
  request(ENDPOINTS.payrollComponents, {
    method: "POST",
    body: JSON.stringify({ name, type, calculationType, defaultValue }),
  });

// POST /api/v1/payroll/structure
//   { designation, totalEarnings, components: { "Basic Salary": 18000, "HRA": 7200 } }
export const createSalaryStructure = ({ designation, totalEarnings, components }) =>
  request(ENDPOINTS.payrollStructure, {
    method: "POST",
    body: JSON.stringify({ designation, totalEarnings, components }),
  });

// ---------- S-15 Payroll Processing ----------

// one payroll row. Tintu's T-15 draft table can reuse this.
const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));

export const normalizeRecord = (r) => ({
  id: r.id ?? r.employeeId,
  employeeId: r.employeeId ?? r.employee?.id,
  employeeName:
    r.employeeName || r.employee?.fullName || r.employee?.name || `Employee ${r.employeeId ?? ""}`.trim(),
  gross: num(r.grossSalary ?? r.gross ?? r.grossPay ?? r.totalEarnings),
  deductions: num(r.totalDeductions ?? r.deductions),
  net: num(r.netSalary ?? r.netPay ?? r.net),
  status: String(r.status || "").toUpperCase(),
});

// POST /api/v1/payroll/process/{month}   month = "2026-10"
//   -> { message, totalEmployeesProcessed, records: [...] }
export const processPayroll = async (month) => {
  const data = await request(ENDPOINTS.payrollProcess(month), { method: "POST" });
  const records = Array.isArray(data?.records) ? data.records.map(normalizeRecord) : [];
  return {
    message: data?.message || "",
    totalProcessed: data?.totalEmployeesProcessed ?? records.length,
    records,
  };
};
