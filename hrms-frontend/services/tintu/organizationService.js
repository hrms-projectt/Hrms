import api from "./api";

// POST http://localhost:8080/api/v1/organizations
export const createOrganization = (data) => api.post("/organizations", data);

// GET http://localhost:8080/api/v1/organizations/{id}
export const getOrganization = (id) => api.get(`/organizations/${id}`);

// POST http://localhost:8080/api/v1/s3/upload-logo   multipart, field name: file   ->  { url }
// (confirmed by Naresh. The backend stores the file locally for now and switches
//  to S3 later. The returned url is what we save in logoUrl.)
export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/s3/upload-logo", formData);
};
