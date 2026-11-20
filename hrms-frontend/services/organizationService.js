import { request } from "./api";

// All organization URLs live here (base URL comes from NEXT_PUBLIC_API_URL in .env.local)
const ORGANIZATIONS = "/api/v1/organizations";
const UPLOAD_LOGO = "/api/v1/s3/upload-logo";

// POST /api/v1/organizations
// body: { name, contactEmail, logoUrl, address: { street, city, state, country, pincode } }
export const createOrganization = (payload) =>
  request(ORGANIZATIONS, { method: "POST", body: JSON.stringify(payload) });

// POST /api/v1/s3/upload-logo   (multipart, field name: file)   ->  { url }
// Upload the logo first, then send the returned url as logoUrl when saving the organization.
export const uploadLogo = (file) => {
  const form = new FormData();
  form.append("file", file);
  return request(UPLOAD_LOGO, { method: "POST", body: form });
};
