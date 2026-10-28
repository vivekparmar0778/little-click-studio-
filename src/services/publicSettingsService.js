const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

export async function getPublicSettings({ signal } = {}) {
  const response = await fetch(`${API_BASE}/settings/`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to load studio details. Please try again.");
  }

  const data = await response.json();

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data.studioName !== "string"
  ) {
    throw new Error("Invalid studio settings response.");
  }

  return data;
}