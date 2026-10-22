
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const AUTH_ENDPOINTS = {
  me: "/api/auth/me/",
  login: "/api/auth/login/",
};

const TOKEN_KEY = "lcs_auth_token";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await fetch(AUTH_ENDPOINTS.me, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem(TOKEN_KEY);
        }

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

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: "POST",
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

    if (!data.token) {
      throw new Error("The server did not return an authentication token.");
    }

    sessionStorage.setItem(TOKEN_KEY, data.token);

    const currentUser = await refreshUser();

    if (!currentUser) {
      sessionStorage.removeItem(TOKEN_KEY);
      throw new Error(
        "Login succeeded, but the authenticated session could not be verified."
      );
    }

    return currentUser;
  }, [refreshUser]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.is_staff === true,
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
