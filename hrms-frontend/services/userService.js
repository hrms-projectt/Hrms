import { request } from "./api";
import { ENDPOINTS } from "./endpoints";

// GET /api/v1/roles  ->  [{ id, name }]
export const getRoles = async () => {
  const data = await request(ENDPOINTS.roles);
  const list = Array.isArray(data) ? data : [];
  const wanted = list.filter((r) => ["HR_ADMIN", "MANAGER"].includes(r.name));
  // if the role names in your DB are different, show everything except SUPER_ADMIN
  return wanted.length ? wanted : list.filter((r) => r.name !== "SUPER_ADMIN");
};

// POST /api/v1/users  body = Naresh's UserCreationDto: fullName, email, password, roleId
export const createUser = ({ fullName, email, password, roleId }) =>
  request(ENDPOINTS.createUser, {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, roleId }),
  });