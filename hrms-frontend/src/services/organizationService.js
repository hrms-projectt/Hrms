import apiRequest from "./api";

export const saveOrganization = async ({
  name,
  contactEmail,
  logoUrl,
  address,
}) => {
  return apiRequest("/api/v1/organizations", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      name,
      contactEmail,
      logoUrl,
      address,
    }),
  });
};