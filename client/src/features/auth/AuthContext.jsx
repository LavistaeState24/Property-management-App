import { createContext, useEffect, useState } from "react";

import { authService } from "../../services/authService";
import { authStorage } from "../../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(Boolean(authStorage.getToken()));

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.me();
        setUser(currentUser);
        authStorage.setUser(currentUser);
      } catch (_error) {
        authStorage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const login = async (payload) => {
    const data = await authService.login(payload);
    setUser(data.user);
    setToken(data.token);
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

