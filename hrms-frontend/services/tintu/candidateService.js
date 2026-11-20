// import api from "./api";

// // ASSUMED: confirm these URLs with Naresh and change only here
// // GET  /api/v1/recruitment/candidates
// export const getCandidates = () => api.get("/recruitment/candidates");

// // GET  /api/v1/recruitment/candidates/{id}
// export const getCandidateById = (id) => api.get(`/recruitment/candidates/${id}`);

// // POST /api/v1/recruitment/candidates/{id}/convert
// export const convertCandidateToEmployee = (id) =>
//   api.post(`/recruitment/candidates/${id}/convert`);
import api from "./api";

// GET  /api/v1/recruitment/candidates   (exists in the backend, see docs/API.md)
export const getCandidates = () => api.get("/recruitment/candidates");

// The backend has NO "get one candidate by id" API yet, so we find the
// candidate in the list. When Naresh adds GET /recruitment/candidates/{id},
// replace this function with:  api.get(`/recruitment/candidates/${id}`)
export const getCandidateById = async (id) => {
  const res = await api.get("/recruitment/candidates");
  const d = res.data;
  const list = Array.isArray(d) ? d : d?.candidates ?? d?.content ?? [];
  const found = list.find((c) => String(c.id) === String(id));

  if (!found) {
    const err = new Error("Candidate not found.");
    err.response = { status: 404, data: { message: "Candidate not found." } };
    throw err;
  }

  // the profile page reads jobTitle; the backend sends jobOpening.title
  return {
    data: { ...found, jobTitle: found.jobTitle || found.jobOpening?.title || "" },
    status: 200,
    headers: {},
  };
};

// POST /api/v1/recruitment/candidates/{id}/convert   (exists, see docs/API.md)
export const convertCandidateToEmployee = (id) =>
  api.post(`/recruitment/candidates/${id}/convert`);