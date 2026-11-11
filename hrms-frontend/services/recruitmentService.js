import { request, formatDate } from "./api";
import { ENDPOINTS } from "./endpoints";

// Naresh's Candidate entity -> the shape the Kanban page uses
const normalize = (c) => ({
  id: c.id,
  name: c.fullName || c.name || "Unknown",
  email: c.email || "",
  phone: c.phone || "",
  position:
    c.jobOpening?.title ||
    c.jobOpening?.jobTitle ||
    c.jobOpening?.position ||
    c.jobOpening?.name ||
    c.position ||
    "",
  experience: c.experience || "",
  location: c.location || c.jobOpening?.location || "",
  source: c.source || "",
  appliedOn: formatDate(c.appliedOn || c.appliedDate || c.appliedAt || c.createdAt),
  skills: c.skills || [],
  notes: c.notes || "",
  resumeUrl: c.resumeS3Url || c.resumeUrl || "",
  status: (c.status || "").toUpperCase(),
});

const toList = (data) =>
  Array.isArray(data) ? data : data?.candidates || data?.content || [];

// GET candidates
export const getCandidates = async () => {
  const data = await request(ENDPOINTS.candidates);
  return toList(data).map(normalize);
};

// PUT candidates/{id}/status   body: { status }
export const updateCandidateStatus = (id, status) =>
  request(ENDPOINTS.candidateStatus(id), {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

// GET job-openings
export const getJobOpenings = async () => {
  const data = await request(ENDPOINTS.jobOpenings);
  const list = Array.isArray(data) ? data : data?.content || [];
  return list.map((j) => ({
    id: j.id,
    title: j.title || "Untitled",
    status: (j.status || "OPEN").toUpperCase(),
  }));
};

// POST job-openings   body: { title, description, department, location }
export const createJobOpening = (payload) =>
  request(ENDPOINTS.jobOpenings, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// POST candidates (multipart): fullName, email, phone, jobOpeningId, resume
export const createCandidate = ({ fullName, email, phone, jobOpeningId, resume }) => {
  const form = new FormData();
  form.append("fullName", fullName);
  form.append("email", email);
  form.append("phone", phone);
  form.append("jobOpeningId", String(jobOpeningId));
  form.append("resume", resume);
  return request(ENDPOINTS.candidates, { method: "POST", body: form });
};

// POST candidates/{id}/convert  (creates an employee record)
export const convertCandidate = (id) =>
  request(ENDPOINTS.convertCandidate(id), { method: "POST" });
