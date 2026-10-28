const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

export async function getPublicPortfolio({
  signal,
  page = 1,
} = {}) {
  const response = await fetch(
    `${API_BASE}/galleries/public/photos/?page=${page}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("Unable to load portfolio. Please try again.");
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.results)) {
    throw new Error("Invalid portfolio response.");
  }

  return data;
}