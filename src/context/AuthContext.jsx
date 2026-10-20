
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  
  useState,
} from "react";

const AuthContext = createContext(null);

// Replace these paths with the actual Django API routes.
const AUTH_ENDPOINTS = {
  me: "/api/auth/me/",
  login: "/api/auth/login/",
  logout: "/api/auth/logout/",
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(AUTH_ENDPOINTS.me, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();
      const currentUser = data.user ?? data;

      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);



  const login = useCallback(async (credentials) => {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          data.email?.[0] ||
          data.password?.[0] ||
          "Unable to sign in. Check your credentials and try again."
      );
    }

    // Prefer the server's authenticated-user endpoint as the
    // source of truth for the user's role and permissions.
    const currentUser = await refreshUser();

    if (!currentUser) {
      throw new Error(
        "Sign-in response received, but the authenticated session could not be verified."
      );
    }

    return currentUser;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch(AUTH_ENDPOINTS.logout, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin" || user?.is_staff === true,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

export default AuthProvider;
