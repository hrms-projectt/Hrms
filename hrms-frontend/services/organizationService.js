const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createOrganization = async (payload) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/organizations`,  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    const details = data.errors
      ? Object.values(data.errors).flat().join(", ")
      : "";
    throw new Error(
      data.message ||
        details ||
        data.title ||
        `Request failed (${response.status})`
    );
  }

  return data;
};