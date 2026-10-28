const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

function findErrorMessage(value) {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map(findErrorMessage).find(Boolean) ?? null;
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(findErrorMessage).find(Boolean) ?? null;
  }

  return null;
}

export async function createInquiry(inquiry) {
  const response = await fetch(`${API_ROOT}/inquiries/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inquiry),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      findErrorMessage(data) || "Your inquiry could not be sent. Please try again."
    );
  }

  return data;
}