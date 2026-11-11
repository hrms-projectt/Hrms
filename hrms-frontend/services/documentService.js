import { request, formatDate } from "./api";
import { ENDPOINTS } from "./endpoints";

// Naresh's Document entity -> the shape the Documents page uses.
const normalize = (d) => ({
  id: d.id,
  ownerType: d.ownerType || "EMPLOYEE",
  ownerName: d.ownerName || "Unknown",
  email: d.email || "",
  phone: d.phone || "",
  position: d.position || "",
  department: d.department || "",
  docType: d.docType || "Document",
  fileName: d.fileName || "",
  fileType: d.fileType || "",
  fileUrl: d.fileUrl || "",
  uploadedOn: formatDate(d.uploadedOn || d.uploadedAt || d.createdAt),
  status: (d.status || "PENDING").toUpperCase(),
  remarks: d.remarks || d.rejectionReason || "",
  reviewedBy: d.reviewedBy || "",
  reviewedOn: formatDate(d.reviewedOn),
});

const toList = (data) =>
  Array.isArray(data) ? data : data?.documents || data?.content || [];

// The stored fileUrl is a private S3 file. GET documents/{id}/file returns
// { url } with a temporary signed link the browser can open directly.
const withPreviewUrl = async (d) => {
  if (!d.id) return d;
  try {
    const res = await request(ENDPOINTS.documentFile(d.id));
    return { ...d, fileUrl: res.url || "" };
  } catch {
    return { ...d, fileUrl: "" };
  }
};

// GET documents (+ a preview link for each one)
export const getDocuments = async () => {
  const data = await request(ENDPOINTS.documents);
  const list = toList(data).map(normalize);
  return Promise.all(list.map(withPreviewUrl));
};

// Only the number of PENDING documents (used by the sidebar badge, no previews)
export const getPendingCount = async () => {
  const data = await request(ENDPOINTS.documents);
  return toList(data).filter(
    (d) => String(d.status || "PENDING").toUpperCase() === "PENDING"
  ).length;
};

// PUT documents/{id}/verify
export const verifyDocument = (id) =>
  request(ENDPOINTS.documentVerify(id), { method: "PUT" });

// PUT documents/{id}/reject   body: { reason }
export const rejectDocument = (id, reason) =>
  request(ENDPOINTS.documentReject(id), {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });

// PUT documents/{id}/request-reupload   body: { note }
export const requestReupload = (id, note) =>
  request(ENDPOINTS.documentReupload(id), {
    method: "PUT",
    body: JSON.stringify({ note }),
  });

// POST documents (multipart): file, ownerType, ownerName, email, docType
export const uploadDocument = ({ file, ownerType, ownerName, email, docType }) => {
  const form = new FormData();
  form.append("file", file);
  form.append("ownerType", ownerType);
  form.append("ownerName", ownerName);
  form.append("email", email);
  form.append("docType", docType);
  return request(ENDPOINTS.documents, { method: "POST", body: form });
};
