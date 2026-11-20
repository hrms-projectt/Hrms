export function getErrorMessage(result) {
  const d = result?.data;
  if (!result?.status) {
    if (typeof d === "string" && d) return d;
    if (d?.message || d?.error) return d.message || d.error;
    return "Cannot connect to the server. Please check that the backend is running.";
  }
  if (typeof d === "string" && d) return d;
  return d?.message || d?.error || `Something went wrong (status ${result.status}).`;
}
