/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);
const API_ROOT = `${(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(/\/+$/, "")}/`;
const ACCESS = "lcs_access_token";
const REFRESH = "lcs_refresh_token";
let sessionVersion = 0;
let refreshRequest = null;

function errorMessage(data, fallback) {
  const find = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(find).find(Boolean);
    if (value && typeof value === "object")
      return Object.values(value).map(find).find(Boolean);
    return null;
  };
  return find(data) || fallback;
}
function clearTokens() {
  [ACCESS, REFRESH, "lcs_auth_token"].forEach((key) =>
    sessionStorage.removeItem(key),
  );
}
function ensureSession(version) {
  if (version !== sessionVersion)
    throw new Error("Your session changed. Please try again.");
}
function apiURL(path) {
  if (
    typeof path !== "string" ||
    path.startsWith("/") ||
    path.includes(":") ||
    path.includes("..")
  ) {
    throw new Error("Invalid API path.");
  }
  return `${API_ROOT}${path}`;
}
async function refreshAccessToken(version) {
  ensureSession(version);
  if (refreshRequest?.version === version) return refreshRequest.promise;
  const refresh = sessionStorage.getItem(REFRESH);
  if (!refresh) return null;
  const request = { version, promise: null };
  request.promise = (async () => {
    const response = await fetch(apiURL("auth/token/refresh/"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });
    const data = await response.json().catch(() => ({}));
    ensureSession(version);
    if (response.status === 401) {
      clearTokens();
      return null;
    }
    if (!response.ok || typeof data.access !== "string" || !data.access) {
      throw new Error(errorMessage(data, "Unable to refresh your session."));
    }
    sessionStorage.setItem(ACCESS, data.access);
    if (typeof data.refresh === "string" && data.refresh)
      sessionStorage.setItem(REFRESH, data.refresh);
    return data.access;
  })();
  refreshRequest = request;
  try {
    return await request.promise;
  } finally {
    if (refreshRequest === request) refreshRequest = null;
  }
}
async function authenticatedRequest(path, options = {}, version) {
  ensureSession(version);

  let access =
    sessionStorage.getItem(ACCESS) || (await refreshAccessToken(version));

  ensureSession(version);
  if (!access) return null;

  const send = (token) => {
    const headers = new Headers(options.headers);
    let body = options.body;

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
    const isUrlSearchParams =
      typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams;
    const isArrayBuffer =
      typeof ArrayBuffer !== "undefined" &&
      (body instanceof ArrayBuffer || ArrayBuffer.isView(body));

    if (isFormData) {
      // Browser khud multipart boundary ke saath Content-Type set karega.
      headers.delete("Content-Type");
    } else if (
      body !== null &&
      body !== undefined &&
      typeof body === "object" &&
      !isBlob &&
      !isUrlSearchParams &&
      !isArrayBuffer
    ) {
      // Plain object/array ko JSON request body banata hai.
      body = JSON.stringify(body);

      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    } else if (typeof body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    headers.set("Authorization", `Bearer ${token}`);

    return fetch(apiURL(path), {
      ...options,
      body,
      headers,
    });
  };

  let response = await send(access);
  ensureSession(version);

  if (response.status === 401) {
    const latest = sessionStorage.getItem(ACCESS);

    access =
      latest && latest !== access
        ? latest
        : await refreshAccessToken(version);

    ensureSession(version);
    if (!access) return null;

    response = await send(access);
    ensureSession(version);

    if (response.status === 401) {
      clearTokens();
      return null;
    }
  }

  return response;
}
function responseUser(data) {
  if (!data?.user || typeof data.user !== "object" || data.user.id == null) {
    throw new Error("The server returned invalid account details.");
  }
  return data.user;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiRequest = useCallback(async (path, options = {}) => {
    const version = sessionVersion;
    const response = await authenticatedRequest(path, options, version);
    if (!response) {
      ensureSession(version);
      setUser(null);
      throw new Error("Your session has expired. Please log in again.");
    }
    const data =
      response.status === 204 ? null : await response.json().catch(() => ({}));
    ensureSession(version);
    if (!response.ok)
      throw new Error(errorMessage(data, "Unable to complete your request."));
    return data;
  }, []);

  const apiBlobRequest = useCallback(async (path, options = {}) => {
    const version = sessionVersion;
    const headers = new Headers(options.headers);
    headers.set("Accept", "image/jpeg, application/json");
    const response = await authenticatedRequest(
      path,
      { ...options, headers, cache: "no-store" },
      version,
    );
    if (!response) {
      ensureSession(version);
      setUser(null);
      throw new Error("Your session has expired. Please log in again.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      ensureSession(version);
      throw new Error(errorMessage(data, "Unable to load this photograph."));
    }
    if (!response.headers.get("Content-Type")?.startsWith("image/jpeg")) {
      throw new Error("The server did not return a photograph.");
    }
    const blob = await response.blob();
    ensureSession(version);
    return blob;
  }, []);

  const refreshUser = useCallback(async () => {
    const version = sessionVersion;
    try {
      const response = await authenticatedRequest(
        "auth/me/",
        { method: "GET" },
        version,
      );
      if (!response) {
        ensureSession(version);
        setUser(null);
        return null;
      }
      const data = await response.json();
      ensureSession(version);
      if (!response.ok)
        throw new Error(errorMessage(data, "Unable to load your account."));
      const current = responseUser(data);
      setUser(current);
      return current;
    } catch {
      return null;
    } finally {
      if (version === sessionVersion) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void refreshUser();
    });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const version = ++sessionVersion;
    clearTokens();
    setUser(null);
    setLoading(true);
    try {
      const response = await fetch(apiURL("auth/login/"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      ensureSession(version);
      if (!response.ok)
        throw new Error(
          errorMessage(data, "Unable to sign in. Check your credentials."),
        );
      if (
        typeof data.access !== "string" ||
        !data.access ||
        typeof data.refresh !== "string" ||
        !data.refresh
      ) {
        throw new Error(
          "The server did not return valid authentication tokens.",
        );
      }
      const current = responseUser(data);
      sessionStorage.setItem(ACCESS, data.access);
      sessionStorage.setItem(REFRESH, data.refresh);
      setUser(current);
      return current;
    } finally {
      if (version === sessionVersion) setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (changes) => {
      const version = sessionVersion;
      const data = await apiRequest("auth/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: changes.first_name,
          last_name: changes.last_name,
          phone_number: changes.phone_number,
          city: changes.city,
        }),
      });
      ensureSession(version);
      const current = responseUser(data);
      setUser(current);
      return current;
    },
    [apiRequest],
  );

  const logout = useCallback(() => {
    sessionVersion += 1;
    clearTokens();
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.is_staff === true || user?.is_superuser === true,
        login,
        logout,
        refreshUser,
        updateProfile,
        apiRequest,
        apiBlobRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
