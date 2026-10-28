const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

export async function getPublicServices({ signal } = {}) {
  const response = await fetch(`${API_BASE}/services/`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Services load nahi ho paayi. Please try again.");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid services response.");
  }

  return data;
}