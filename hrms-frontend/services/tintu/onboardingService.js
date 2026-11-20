// Onboarding documents -> uses the backend's REAL document APIs (see docs/API.md):
//   GET  /api/v1/documents                 (all documents, we filter by the employee's email)
//   GET  /api/v1/documents/{id}/file       (temporary S3 link to open the file)
//   POST /api/v1/documents                 (multipart: file, ownerType, ownerName, email, docType)
//   PUT  /api/v1/documents/{id}/verify
//   PUT  /api/v1/documents/{id}/reject            body { reason }
//   PUT  /api/v1/documents/{id}/request-reupload  body { note }
// The page (OnboardingDocumentsPage.jsx) is NOT changed: this file converts the
// backend shape into the shape the page already expects.
import { request } from "../api";
import { ENDPOINTS } from "../endpoints";
import { DOCUMENT_TYPES } from "./config/documentTypes";

// callApi() expects an axios-like { data, status }
const ok = (data) => ({ data, status: 200, headers: {} });

const toList = (d) => (Array.isArray(d) ? d : d?.documents ?? d?.content ?? []);

// backend stores the label ("PAN Card"); the page uses the value ("PAN")
const typeValue = (label) =>
  DOCUMENT_TYPES.find(
    (t) => t.label.toLowerCase() === String(label || "").trim().toLowerCase()
  )?.value || label;

const typeLabel = (value) => DOCUMENT_TYPES.find((t) => t.value === value)?.label || value;

const fullName = (e) =>
  `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.fullName || e.name || "";

// there is no "get employee by id" API yet, so look the employee up in the list
const findEmployee = async (employeeId) => {
  const data = await request(ENDPOINTS.employees);
  const emp = toList(data).find((e) => String(e.id) === String(employeeId));
  if (!emp) throw new Error("Employee not found.");
  return emp;
};

// GET list of one employee's documents
export const getEmployeeDocuments = async (employeeId) => {
  const emp = await findEmployee(employeeId);
  const email = String(emp.email || "").toLowerCase();

  const all = toList(await request(ENDPOINTS.documents));
  const mine = all.filter(
    (d) =>
      String(d.email || "").toLowerCase() === email &&
      String(d.ownerType || "EMPLOYEE").toUpperCase() === "EMPLOYEE"
  );

  const docs = await Promise.all(
    mine.map(async (d) => {
      let fileUrl = "";
      try {
        fileUrl = (await request(ENDPOINTS.documentFile(d.id))).url || "";
      } catch {
        fileUrl = "";
      }
      const status = String(d.status || "PENDING").toUpperCase();
      return {
        documentId: d.id,
        documentType: typeValue(d.docType),
        verificationStatus: status === "REUPLOAD_REQUESTED" ? "REQUEST_REUPLOAD" : status,
        fileUrl,
        rejectionReason: d.remarks || d.rejectionReason || "",
      };
    })
  );
  return ok(docs);
};

// Verify / Reject / Request re-upload.  body = { status, rejectionReason }
export const verifyDocument = async (documentId, { status, rejectionReason } = {}) => {
  if (status === "VERIFIED") {
    return ok(await request(ENDPOINTS.documentVerify(documentId), { method: "PUT" }));
  }
  if (status === "REJECTED") {
    return ok(
      await request(ENDPOINTS.documentReject(documentId), {
        method: "PUT",
        body: JSON.stringify({ reason: rejectionReason }),
      })
    );
  }
  if (status === "REQUEST_REUPLOAD") {
    return ok(
      await request(ENDPOINTS.documentReupload(documentId), {
        method: "PUT",
        body: JSON.stringify({ note: rejectionReason || "Please upload this document again." }),
      })
    );
  }
  throw new Error("Unknown document status.");
};

// Upload one document for this employee
export const uploadEmployeeDocument = async (employeeId, file, documentType) => {
  const emp = await findEmployee(employeeId);
  const form = new FormData();
  form.append("file", file);
  form.append("ownerType", "EMPLOYEE");
  form.append("ownerName", fullName(emp));
  form.append("email", emp.email || "");
  form.append("docType", typeLabel(documentType));
  return ok(await request(ENDPOINTS.documents, { method: "POST", body: form }));
};
